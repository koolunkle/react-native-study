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

export async function insertHabit(db: SQLiteDatabase, input: NewHabitInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO habits (name, icon, category, memo, repeat_type, repeat_count)
     VALUES (?, ?, ?, ?, ?, ?)`,
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
