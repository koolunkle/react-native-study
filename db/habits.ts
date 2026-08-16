import { type SQLiteDatabase } from 'expo-sqlite';

export type RepeatType = 'daily' | 'weekly_n';

export type Habit = {
  id: number;
  name: string;
  icon: string;
  category: string;
  memo: string | null;
  repeatType: RepeatType;
  repeatCount: number | null;
  reminderTime: string | null;
  reminderEnabled: boolean;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
};

export type HabitRow = {
  id: number;
  name: string;
  icon: string;
  category: string;
  memo: string | null;
  repeat_type: RepeatType;
  repeat_count: number | null;
  reminder_time: string | null;
  reminder_enabled: number;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
};

export function habitFromRow(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    category: row.category,
    memo: row.memo,
    repeatType: row.repeat_type,
    repeatCount: row.repeat_count,
    reminderTime: row.reminder_time,
    reminderEnabled: row.reminder_enabled === 1,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  };
}

/** 보관되지 않은(그만두지 않은) 습관 목록. 홈/체크 화면에서 사용. */
export async function listActiveHabits(db: SQLiteDatabase): Promise<Habit[]> {
  const rows = await db.getAllAsync<HabitRow>(
    `SELECT * FROM habits WHERE archived_at IS NULL ORDER BY sort_order ASC, id ASC`
  );
  return rows.map(habitFromRow);
}

/** 습관 개수 제한(PRD 6-1 단계별 제한) 체크용. */
export async function countActiveHabits(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM habits WHERE archived_at IS NULL`
  );
  return row?.count ?? 0;
}

export type NewHabitInput = {
  name: string;
  icon: string;
  category: string;
  memo?: string | null;
  repeatType: RepeatType;
  repeatCount?: number | null;
};

/**
 * created_at을 INSERT에서 명시적으로 localtime으로 지정한다 — 테이블의 DEFAULT
 * 절에만 의존하면 이미 생성된(예전 UTC 기본값의) 테이블에는 반영되지 않기 때문에,
 * 스키마 재생성 없이도 항상 올바른 로컬 날짜로 저장되도록 하기 위함.
 */
export async function insertHabit(db: SQLiteDatabase, input: NewHabitInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO habits (name, icon, category, memo, repeat_type, repeat_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
    [
      input.name,
      input.icon,
      input.category,
      input.memo ?? null,
      input.repeatType,
      input.repeatType === 'weekly_n' ? (input.repeatCount ?? null) : null,
    ]
  );
  return result.lastInsertRowId;
}

export async function getHabitById(db: SQLiteDatabase, id: number): Promise<Habit | null> {
  const row = await db.getFirstAsync<HabitRow>(`SELECT * FROM habits WHERE id = ?`, [id]);
  return row ? habitFromRow(row) : null;
}

export type UpdateHabitInput = {
  name: string;
  icon: string;
  category: string;
  memo?: string | null;
  repeatType: RepeatType;
  repeatCount?: number | null;
  reminderTime?: string | null;
  reminderEnabled: boolean;
};

export async function updateHabit(
  db: SQLiteDatabase,
  id: number,
  input: UpdateHabitInput
): Promise<void> {
  await db.runAsync(
    `UPDATE habits
     SET name = ?, icon = ?, category = ?, memo = ?, repeat_type = ?, repeat_count = ?,
         reminder_time = ?, reminder_enabled = ?
     WHERE id = ?`,
    [
      input.name,
      input.icon,
      input.category,
      input.memo ?? null,
      input.repeatType,
      input.repeatType === 'weekly_n' ? (input.repeatCount ?? null) : null,
      input.reminderEnabled ? (input.reminderTime ?? null) : null,
      input.reminderEnabled ? 1 : 0,
      id,
    ]
  );
}

/**
 * 그만두기(보관) — 목록에서만 숨김, 지난 기록은 유지.
 * localtime으로 저장 — schema.ts의 created_at과 동일한 이유(로컬 날짜 비교 일관성).
 */
export async function archiveHabit(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(`UPDATE habits SET archived_at = datetime('now', 'localtime') WHERE id = ?`, [
    id,
  ]);
}

/** 완전 삭제 — 되돌릴 수 없음. habit_logs는 ON DELETE CASCADE로 함께 삭제됨. */
export async function deleteHabit(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(`DELETE FROM habits WHERE id = ?`, [id]);
}

/** 보관함(그만둔 습관) 목록 — 완전 삭제 화면에서 사용. */
export async function listArchivedHabits(db: SQLiteDatabase): Promise<Habit[]> {
  const rows = await db.getAllAsync<HabitRow>(
    `SELECT * FROM habits WHERE archived_at IS NOT NULL ORDER BY archived_at DESC`
  );
  return rows.map(habitFromRow);
}
