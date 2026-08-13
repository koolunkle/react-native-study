import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { type SQLiteDatabase } from 'expo-sqlite';

import { listActiveHabits, type Habit } from '@/db/habits';
import { getAppSettings } from '@/db/settings';

/**
 * 알림/설정 (PRD 6-4) — 완전 오프라인 로컬 알림만 사용하므로, "미완료 리마인더"의
 * 문구는 발사 시점의 실제 미완료 개수를 반영하지 못하는 고정 문구로 구현한다
 * (배경 태스크 없이는 스케줄된 시점에 개수를 재계산할 수 없음 — 의도적 MVP 범위).
 *
 * expo-notifications는 웹에서 로컬 알림 예약 API를 지원하지 않고, Expo Go의 Android에서는
 * SDK 53부터 원격 푸시 관련 코드가 제거되어 "단순히 import만 해도" 예외를 던진다
 * (내부적으로 모듈 최상단에서 push-token 자동 등록 리스너를 등록하기 때문).
 * 그래서 Platform 체크를 함수 안에서 하는 것만으로는 막을 수 없고, 지원되지 않는
 * 환경에서는 모듈 자체를 아예 불러오지 않도록 동적 import로 지연 로딩한다.
 */

export const NOTIFICATIONS_SUPPORTED =
  Platform.OS !== 'web' && !(Platform.OS === 'android' && isRunningInExpoGo());

type NotificationsModule = typeof import('expo-notifications');

let modulePromise: Promise<NotificationsModule> | null = null;

function loadNotifications(): Promise<NotificationsModule> | null {
  if (!NOTIFICATIONS_SUPPORTED) return null;
  if (!modulePromise) {
    modulePromise = import('expo-notifications').then((mod) => {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      return mod;
    });
  }
  return modulePromise;
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
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '알림',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelHabitReminder(habitId: number): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(habitReminderId(habitId));
}

/** 습관별 리마인더 재스케줄 — 항상 먼저 취소 후, 조건을 만족할 때만 다시 예약한다. */
export async function scheduleHabitReminder(
  habit: Habit,
  notifGlobalEnabled: boolean
): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

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
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(INCOMPLETE_REMINDER_ID);
}

export async function scheduleIncompleteReminder(time: string): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

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
  const Notifications = await loadNotifications();
  if (!Notifications) return;
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
