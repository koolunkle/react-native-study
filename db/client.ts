import { type SQLiteDatabase } from "expo-sqlite";

import { SCHEMA_SQL } from "./schema";

export const DB_NAME = "happyhabit.db";

/** SQLiteProvider의 onInit으로 전달. 앱 최초 실행 시 스키마를 생성한다. */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(SCHEMA_SQL);
}
