import { type SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_HABIT_LIMIT, HABIT_LIMIT_STAGES } from '@/constants/HabitOptions';

export type SettingsKey =
  | 'habit_limit_level'
  | 'notif_global_enabled'
  | 'notif_incomplete_enabled'
  | 'notif_incomplete_time';

export async function getSetting(db: SQLiteDatabase, key: SettingsKey): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?`,
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(db: SQLiteDatabase, key: SettingsKey, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

export type AppSettings = {
  habitLimitLevel: number;
  notifGlobalEnabled: boolean;
  notifIncompleteEnabled: boolean;
  notifIncompleteTime: string;
};

/**
 * 알림은 첫 실행 시 무단으로 권한을 요청하지 않도록 기본 off.
 * 습관 개수 제한은 기존 DEFAULT_HABIT_LIMIT(1단계 새싹)과 동일한 기본값.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  habitLimitLevel: DEFAULT_HABIT_LIMIT.level,
  notifGlobalEnabled: false,
  notifIncompleteEnabled: false,
  notifIncompleteTime: '21:00',
};

export async function getAppSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const rows = await db.getAllAsync<{ key: SettingsKey; value: string }>(
    `SELECT key, value FROM app_settings`
  );
  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    habitLimitLevel: map.has('habit_limit_level')
      ? Number(map.get('habit_limit_level'))
      : DEFAULT_SETTINGS.habitLimitLevel,
    notifGlobalEnabled: map.has('notif_global_enabled')
      ? map.get('notif_global_enabled') === '1'
      : DEFAULT_SETTINGS.notifGlobalEnabled,
    notifIncompleteEnabled: map.has('notif_incomplete_enabled')
      ? map.get('notif_incomplete_enabled') === '1'
      : DEFAULT_SETTINGS.notifIncompleteEnabled,
    notifIncompleteTime: map.get('notif_incomplete_time') ?? DEFAULT_SETTINGS.notifIncompleteTime,
  };
}

export async function setHabitLimitLevel(db: SQLiteDatabase, level: number): Promise<void> {
  await setSetting(db, 'habit_limit_level', String(level));
}

export async function setNotifGlobalEnabled(db: SQLiteDatabase, enabled: boolean): Promise<void> {
  await setSetting(db, 'notif_global_enabled', enabled ? '1' : '0');
}

export async function setIncompleteReminder(
  db: SQLiteDatabase,
  { enabled, time }: { enabled: boolean; time: string }
): Promise<void> {
  await setSetting(db, 'notif_incomplete_enabled', enabled ? '1' : '0');
  await setSetting(db, 'notif_incomplete_time', time);
}

/** 현재 설정된 습관 개수 제한 단계. HABIT_LIMIT_STAGES에 없는 값이면 기본값으로 폴백. */
export async function getHabitLimitStage(
  db: SQLiteDatabase
): Promise<(typeof HABIT_LIMIT_STAGES)[number]> {
  const { habitLimitLevel } = await getAppSettings(db);
  return HABIT_LIMIT_STAGES.find((stage) => stage.level === habitLimitLevel) ?? DEFAULT_HABIT_LIMIT;
}
