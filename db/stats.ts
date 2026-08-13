import { type SQLiteDatabase } from 'expo-sqlite';

import { type DateRange } from '@/lib/date';

/**
 * 통계(PRD 6-5) 집계 쿼리.
 * "그 날 존재했던 습관" 정의는 db/habitLogs.ts의 getDayDetail과 동일하게
 * (archived_at이 없거나 그 날짜 이후) AND (생성일이 그 날짜 이전) 로 맞춘다.
 * repeat_type(매일/주 N회) 구분 없이 활성 습관은 존재하는 모든 날짜에
 * "기대값 1"로 취급한다 — 홈/캘린더 화면이 이미 그렇게 다루고 있어 일관성을 유지.
 */
function expectedCte(): string {
  return `
    WITH RECURSIVE dates(d) AS (
      SELECT date(?)
      UNION ALL
      SELECT date(d, '+1 day') FROM dates WHERE d < date(?)
    ),
    expected AS (
      SELECT dates.d AS date, h.id AS habit_id, h.icon AS icon, h.name AS name
      FROM dates
      JOIN habits h
        ON (h.archived_at IS NULL OR h.archived_at > dates.d)
       AND date(h.created_at) <= dates.d
    )
  `;
}

export type CompletionSummary = { completed: number; total: number; rate: number };

export async function getOverallCompletionRate(
  db: SQLiteDatabase,
  range: DateRange
): Promise<CompletionSummary> {
  const row = await db.getFirstAsync<{ total: number; completed: number }>(
    `${expectedCte()}
     SELECT
       COUNT(*) AS total,
       COALESCE(SUM(CASE WHEN hl.completed = 1 THEN 1 ELSE 0 END), 0) AS completed
     FROM expected
     LEFT JOIN habit_logs hl ON hl.habit_id = expected.habit_id AND hl.date = expected.date`,
    [range.start, range.end]
  );
  const total = row?.total ?? 0;
  const completed = row?.completed ?? 0;
  return { total, completed, rate: total === 0 ? 0 : completed / total };
}

export type HabitCompletionSummary = CompletionSummary & {
  habitId: number;
  icon: string;
  name: string;
};

export async function getPerHabitCompletionRate(
  db: SQLiteDatabase,
  range: DateRange
): Promise<HabitCompletionSummary[]> {
  const rows = await db.getAllAsync<{
    habitId: number;
    icon: string;
    name: string;
    total: number;
    completed: number;
  }>(
    `${expectedCte()}
     SELECT
       expected.habit_id AS habitId,
       expected.icon AS icon,
       expected.name AS name,
       COUNT(*) AS total,
       COALESCE(SUM(CASE WHEN hl.completed = 1 THEN 1 ELSE 0 END), 0) AS completed
     FROM expected
     LEFT JOIN habit_logs hl ON hl.habit_id = expected.habit_id AND hl.date = expected.date
     GROUP BY expected.habit_id
     ORDER BY expected.habit_id ASC`,
    [range.start, range.end]
  );
  return rows.map((row) => ({
    ...row,
    rate: row.total === 0 ? 0 : row.completed / row.total,
  }));
}

export type WeekdayCompletionSummary = CompletionSummary & { weekday: number };

export async function getWeekdayCompletionRate(
  db: SQLiteDatabase,
  range: DateRange
): Promise<WeekdayCompletionSummary[]> {
  const rows = await db.getAllAsync<{ weekday: number; total: number; completed: number }>(
    `${expectedCte()}
     SELECT
       CAST(strftime('%w', expected.date) AS INTEGER) AS weekday,
       COUNT(*) AS total,
       COALESCE(SUM(CASE WHEN hl.completed = 1 THEN 1 ELSE 0 END), 0) AS completed
     FROM expected
     LEFT JOIN habit_logs hl ON hl.habit_id = expected.habit_id AND hl.date = expected.date
     GROUP BY weekday
     ORDER BY weekday ASC`,
    [range.start, range.end]
  );

  // 범위가 짧아 일부 요일이 아예 없을 수 있으므로 0~6 전체를 0으로 채워 반환.
  const byWeekday = new Map(rows.map((row) => [row.weekday, row]));
  return Array.from({ length: 7 }, (_, weekday) => {
    const row = byWeekday.get(weekday);
    const total = row?.total ?? 0;
    const completed = row?.completed ?? 0;
    return { weekday, total, completed, rate: total === 0 ? 0 : completed / total };
  });
}

export type DayCompletionSummary = CompletionSummary & { date: string };

export async function getHeatmapData(
  db: SQLiteDatabase,
  range: DateRange
): Promise<DayCompletionSummary[]> {
  const rows = await db.getAllAsync<{ date: string; total: number; completed: number }>(
    `${expectedCte()}
     SELECT
       expected.date AS date,
       COUNT(*) AS total,
       COALESCE(SUM(CASE WHEN hl.completed = 1 THEN 1 ELSE 0 END), 0) AS completed
     FROM expected
     LEFT JOIN habit_logs hl ON hl.habit_id = expected.habit_id AND hl.date = expected.date
     GROUP BY expected.date
     ORDER BY expected.date ASC`,
    [range.start, range.end]
  );
  return rows.map((row) => ({
    ...row,
    rate: row.total === 0 ? 0 : row.completed / row.total,
  }));
}

/** 등록된 습관 중 가장 이른 생성일 — '전체' 기간의 하한으로 사용. 습관이 없으면 null. */
export async function getAllTimeStart(db: SQLiteDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ start: string | null }>(
    `SELECT MIN(date(created_at)) AS start FROM habits`
  );
  return row?.start ?? null;
}
