/**
 * PRD 6-1(습관 등록/관리), 6-2(오늘 체크), 6-6(인증 기록) 기반 스키마.
 *
 * habits: 습관 정의. archived_at이 있으면 "그만두기"(목록에서만 숨김) 상태 —
 *         지난 기록은 유지해야 하므로 하드 삭제 대신 소프트 아카이브로 표현.
 *         완전 삭제는 habits row 자체를 지우는 별도 동작(보관함에서만 실행).
 * habit_logs: 날짜별 체크/인증 기록. (habit_id, date) 유니크 — 하루에 한 기록.
 *             edited_at은 지난 기록 수정 시 "수정됨" 표시용(PRD 6-3).
 * app_settings: 설정 화면(PRD 6-4)에서 쓰는 단순 key-value 저장소.
 */
export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  memo TEXT,
  repeat_type TEXT NOT NULL CHECK (repeat_type IN ('daily', 'weekly_n')),
  repeat_count INTEGER,
  reminder_time TEXT,
  reminder_enabled INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  photo_uri TEXT,
  memo TEXT,
  edited_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
