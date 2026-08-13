import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { type SQLiteDatabase } from 'expo-sqlite';

import { listActiveHabits, type Habit } from '@/db/habits';
import { getAppSettings } from '@/db/settings';

/**
 * 알림/설정 (PRD 6-4) — 완전 오프라인 로컬 알림만 사용하므로, "미완료 리마인더"의
 * 문구는 발사 시점의 실제 미완료 개수를 반영하지 못하는 고정 문구로 구현한다
 * (배경 태스크 없이는 스케줄된 시점에 개수를 재계산할 수 없음 — 의도적 MVP 범위).
 *
 * expo-notifications의 로컬 알림 예약/취소 API는 웹에서 지원되지 않는다
 * (PRD 4: 모바일 웹도 병행 지원하는 플랫폼이므로 웹에서는 조용히 no-op 처리).
 */

export const NOTIFICATIONS_SUPPORTED = Platform.OS !== 'web';

if (NOTIFICATIONS_SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const INCOMPLETE_REMINDER_ID = 'incomplete-reminder-global';

function habitReminderId(habitId: number): string {
  return `habit-reminder-${habitId}`;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

export async function initNotifications(): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '알림',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!NOTIFICATIONS_SUPPORTED) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelHabitReminder(habitId: number): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;
  await Notifications.cancelScheduledNotificationAsync(habitReminderId(habitId));
}

/** 습관별 리마인더 재스케줄 — 항상 먼저 취소 후, 조건을 만족할 때만 다시 예약한다. */
export async function scheduleHabitReminder(
  habit: Habit,
  notifGlobalEnabled: boolean
): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;

  const identifier = habitReminderId(habit.id);
  await Notifications.cancelScheduledNotificationAsync(identifier);

  if (!notifGlobalEnabled || !habit.reminderEnabled || !habit.reminderTime) return;

  const { hour, minute } = parseTime(habit.reminderTime);
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: `${habit.icon} ${habit.name}`,
      body: `${habit.name} 할 시간이에요!`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export async function cancelIncompleteReminder(): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;
  await Notifications.cancelScheduledNotificationAsync(INCOMPLETE_REMINDER_ID);
}

export async function scheduleIncompleteReminder(time: string): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;
  await cancelIncompleteReminder();

  const { hour, minute } = parseTime(time);
  await Notifications.scheduleNotificationAsync({
    identifier: INCOMPLETE_REMINDER_ID,
    content: {
      title: '오늘 습관을 확인해보세요 🌿',
      body: '아직 체크하지 않은 습관이 있어요!',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export async function cancelAllReminders(): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** 설정 저장 시점에 현재 DB 상태 기준으로 모든 알림을 일괄 재스케줄. */
export async function rescheduleAllReminders(db: SQLiteDatabase): Promise<void> {
  const settings = await getAppSettings(db);

  if (!settings.notifGlobalEnabled) {
    await cancelAllReminders();
    return;
  }

  const habits = await listActiveHabits(db);
  await Promise.all(habits.map((habit) => scheduleHabitReminder(habit, true)));

  if (settings.notifIncompleteEnabled) {
    await scheduleIncompleteReminder(settings.notifIncompleteTime);
  } else {
    await cancelIncompleteReminder();
  }
}
