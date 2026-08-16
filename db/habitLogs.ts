import { type SQLiteDatabase } from 'expo-sqlite';

import { habitFromRow, type Habit, type HabitRow } from './habits';

export type HabitLog = {
  id: number;
  habitId: number;
  date: string;
  completed: boolean;
  photoUri: string | null;
  memo: string | null;
  editedAt: string | null;
  createdAt: string;
};

type HabitLogRow = {
  id: number;
  habit_id: number;
  date: string;
  completed: number;
  photo_uri: string | null;
  memo: string | null;
  edited_at: string | null;
  created_at: string;
};

function logFromRow(row: HabitLogRow): HabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completed: row.completed === 1,
    photoUri: row.photo_uri,
    memo: row.memo,
    editedAt: row.edited_at,
    createdAt: row.created_at,
  };
}

/**
 * 캘린더 월별 그리드용 — 그 달에 완료 체크된 습관 아이콘을 날짜별로 묶어서 반환.
 * yearMonth는 'YYYY-MM' 형식.
 */
export async function getMonthLogSummary(
  db: SQLiteDatabase,
  yearMonth: string
): Promise<Record<string, string[]>> {
  const rows = await db.getAllAsync<{ date: string; icon: string }>(
    `SELECT hl.date as date, h.icon as icon
     FROM habit_logs hl
     JOIN habits h ON h.id = hl.habit_id
     WHERE hl.completed = 1 AND hl.date LIKE ?
     ORDER BY hl.date ASC, h.sort_order ASC`,
    [`${yearMonth}-%`]
  );

  const summary: Record<string, string[]> = {};
  for (const row of rows) {
    (summary[row.date] ??= []).push(row.icon);
  }
  return summary;
}

export type TimelineDayEntry = {
  date: string;
  entries: { habitId: number; icon: string; name: string; completed: boolean }[];
};

/**
 * 캘린더 리스트(타임라인) 뷰용 — PRD 6-3. yearMonth의 각 날짜마다 "그 날 존재했던 습관"과
 * 완료 여부를 묶어 최신순으로 반환한다. 존재했던 습관의 정의는 getDayDetail/stats.ts의
 * expectedCte()와 동일(archived_at 이전이거나 없음 + created_at 이후)하게 맞춰 일관성을 유지한다.
 * 오늘 이후 날짜는 아직 기록이 없을 게 자명하므로 today를 넘겨 잘라낸다.
 */
export async function getMonthTimeline(
  db: SQLiteDatabase,
  yearMonth: string,
  today: string
): Promise<TimelineDayEntry[]> {
  const rows = await db.getAllAsync<{
    date: string;
    habitId: number;
    icon: string;
    name: string;
    completed: number;
  }>(
    `WITH RECURSIVE dates(d) AS (
       SELECT date(? || '-01')
       UNION ALL
       SELECT date(d, '+1 day') FROM dates
       WHERE d < date(? || '-01', '+1 month', '-1 day')
     )
     SELECT dates.d AS date, h.id AS habitId, h.icon AS icon, h.name AS name,
            COALESCE(hl.completed, 0) AS completed
     FROM dates
     JOIN habits h
       ON (h.archived_at IS NULL OR h.archived_at > dates.d)
      AND date(h.created_at) <= dates.d
     LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.date = dates.d
     WHERE dates.d <= ?
     ORDER BY dates.d DESC, h.sort_order ASC, h.id ASC`,
    [yearMonth, yearMonth, today]
  );

  const byDate = new Map<string, TimelineDayEntry>();
  for (const row of rows) {
    if (!byDate.has(row.date)) {
      byDate.set(row.date, { date: row.date, entries: [] });
    }
    byDate.get(row.date)!.entries.push({
      habitId: row.habitId,
      icon: row.icon,
      name: row.name,
      completed: row.completed === 1,
    });
  }
  return Array.from(byDate.values());
}

export type DayDetailEntry = {
  habit: Habit;
  log: HabitLog | null;
};

/**
 * 날짜 상세 화면용 — 해당 날짜에 존재했던(생성일 이전이 아니고, 그 날짜 이후에 보관된)
 * 습관과 그날의 완료/인증 기록을 합쳐서 반환.
 */
export async function getDayDetail(db: SQLiteDatabase, dateKey: string): Promise<DayDetailEntry[]> {
  const habitRows = await db.getAllAsync<HabitRow>(
    `SELECT * FROM habits
     WHERE (archived_at IS NULL OR archived_at > date(?))
       AND date(created_at) <= date(?)
     ORDER BY sort_order ASC, id ASC`,
    [dateKey, dateKey]
  );
  const logRows = await db.getAllAsync<HabitLogRow>(`SELECT * FROM habit_logs WHERE date = ?`, [
    dateKey,
  ]);
  const logByHabitId = new Map(logRows.map((row) => [row.habit_id, logFromRow(row)]));

  return habitRows.map((row) => ({
    habit: habitFromRow(row),
    log: logByHabitId.get(row.id) ?? null,
  }));
}

/** 특정 날짜의 단일 기록 조회 — 인증 기록(사진/메모) 에디터 초기값 로딩용. */
export async function getHabitLog(
  db: SQLiteDatabase,
  habitId: number,
  dateKey: string
): Promise<HabitLog | null> {
  const row = await db.getFirstAsync<HabitLogRow>(
    `SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?`,
    [habitId, dateKey]
  );
  return row ? logFromRow(row) : null;
}

/**
 * 사진/메모(PRD 6-6) 저장. completed 여부는 건드리지 않는다 — 체크와 별개로 인증 기록만
 * 추가/수정할 수 있어야 하므로. 기록이 아예 없으면 미체크(completed=0) 상태로 새로 만든다.
 * "수정됨" 표시 규칙은 toggleHabitLog과 동일하게 오늘이 아닌 기록을 바꿀 때만 edited_at을 남긴다.
 */
export async function saveHabitLogDetail(
  db: SQLiteDatabase,
  habitId: number,
  dateKey: string,
  detail: { photoUri: string | null; memo: string | null },
  isToday: boolean
): Promise<void> {
  const existing = await db.getFirstAsync<HabitLogRow>(
    `SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?`,
    [habitId, dateKey]
  );

  if (!existing) {
    await db.runAsync(
      `INSERT INTO habit_logs (habit_id, date, completed, photo_uri, memo) VALUES (?, ?, 0, ?, ?)`,
      [habitId, dateKey, detail.photoUri, detail.memo]
    );
    return;
  }

  await db.runAsync(`UPDATE habit_logs SET photo_uri = ?, memo = ?, edited_at = ? WHERE id = ?`, [
    detail.photoUri,
    detail.memo,
    isToday ? existing.edited_at : new Date().toISOString(),
    existing.id,
  ]);
}

/**
 * 완료 토글. 이미 있는 기록을 "오늘이 아닌 날짜"에서 바꾸는 경우에만 edited_at을 남겨
 * PRD 6-3의 "수정됨" 표시에 사용한다 — 당일 토글이나 최초 기록은 수정으로 치지 않는다.
 */
export async function toggleHabitLog(
  db: SQLiteDatabase,
  habitId: number,
  dateKey: string,
  isToday: boolean
): Promise<void> {
  const existing = await db.getFirstAsync<HabitLogRow>(
    `SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?`,
    [habitId, dateKey]
  );

  if (!existing) {
    await db.runAsync(`INSERT INTO habit_logs (habit_id, date, completed) VALUES (?, ?, 1)`, [
      habitId,
      dateKey,
    ]);
    return;
  }

  const nextCompleted = existing.completed === 1 ? 0 : 1;
  await db.runAsync(`UPDATE habit_logs SET completed = ?, edited_at = ? WHERE id = ?`, [
    nextCompleted,
    isToday ? null : new Date().toISOString(),
    existing.id,
  ]);
}
