import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Switch } from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ListRow } from '@/components/ListRow';
import { SectionCard } from '@/components/SectionCard';
import { Text, View } from '@/components/Themed';
import { TimeStepper } from '@/components/TimeStepper';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { HABIT_LIMIT_STAGES } from '@/constants/HabitOptions';
import { Radius, Spacing } from '@/constants/Layout';
import {
  getAppSettings,
  setHabitLimitLevel,
  setIncompleteReminder,
  setNotifGlobalEnabled,
  type AppSettings,
} from '@/db/settings';
import {
  ensureNotificationPermission,
  NOTIFICATIONS_SUPPORTED,
  rescheduleAllReminders,
} from '@/lib/notifications';

/**
 * 설정 — PRD 6-4, 6-1
 */
export default function SettingsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [permissionHint, setPermissionHint] = useState(false);

  const reload = useCallback(() => {
    return getAppSettings(db).then(setSettings);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      reload().then(() => {
        if (cancelled) return;
      });
      return () => {
        cancelled = true;
      };
    }, [reload])
  );

  async function handleToggleGlobal(enabled: boolean) {
    if (enabled) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        setPermissionHint(true);
        return;
      }
    }
    setPermissionHint(false);
    await setNotifGlobalEnabled(db, enabled);
    await rescheduleAllReminders(db);
    await reload();
  }

  async function handleToggleIncomplete(enabled: boolean) {
    if (!settings) return;
    await setIncompleteReminder(db, { enabled, time: settings.notifIncompleteTime });
    await rescheduleAllReminders(db);
    await reload();
  }

  async function handleChangeIncompleteTime(time: string) {
    if (!settings) return;
    await setIncompleteReminder(db, { enabled: settings.notifIncompleteEnabled, time });
    await rescheduleAllReminders(db);
    await reload();
  }

  async function handleChangeLimitLevel(level: number) {
    await setHabitLimitLevel(db, level);
    await reload();
  }

  if (!settings) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정 ⚙️</Text>

      <View style={styles.content}>
        <SectionCard title="알림">
          <ListRow
            icon="🔔"
            label="전체 알림"
            right={
              <Switch
                value={settings.notifGlobalEnabled}
                onValueChange={handleToggleGlobal}
                trackColor={{ true: colors.mintDeep, false: colors.hairline }}
                thumbColor={colors.surface}
              />
            }
          />
          {permissionHint && (
            <Text style={[styles.hint, { color: colors.apricotDeep }]}>
              {NOTIFICATIONS_SUPPORTED
                ? '알림 권한이 거부되었어요. 기기 설정에서 허용해주세요.'
                : '이 브라우저에서는 알림을 사용할 수 없어요. 앱에서 사용해주세요.'}
            </Text>
          )}
          <ListRow
            icon="🌙"
            label="미완료 리마인더"
            right={
              <Switch
                value={settings.notifIncompleteEnabled}
                onValueChange={handleToggleIncomplete}
                disabled={!settings.notifGlobalEnabled}
                trackColor={{ true: colors.mintDeep, false: colors.hairline }}
                thumbColor={colors.surface}
              />
            }
          />
          {settings.notifGlobalEnabled && settings.notifIncompleteEnabled && (
            <View style={[styles.stepperWrap, { borderColor: colors.hairline }]}>
              <TimeStepper value={settings.notifIncompleteTime} onChange={handleChangeIncompleteTime} />
            </View>
          )}
        </SectionCard>

        <SectionCard title="습관 개수 제한">
          <View style={styles.wrapRow}>
            {HABIT_LIMIT_STAGES.map((stage) => (
              <Pressable
                key={stage.level}
                onPress={() => handleChangeLimitLevel(stage.level)}
                style={[
                  styles.pillChip,
                  {
                    backgroundColor:
                      settings.habitLimitLevel === stage.level ? colors.lavender : colors.surface,
                    borderColor:
                      settings.habitLimitLevel === stage.level ? colors.lavenderDeep : colors.hairline,
                  },
                ]}>
                <Text style={styles.pillChipText}>
                  {stage.name} ({stage.max === Infinity ? '무제한' : `${stage.max}개`})
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="습관 관리">
          <ListRow icon="📋" label="습관 관리 목록" onPress={() => router.push('/habit/manage')} />
        </SectionCard>

        <SectionCard title="앱 정보">
          <ListRow icon="ℹ️" label="버전" value={Constants.expoConfig?.version ?? '-'} />
        </SectionCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.title,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: -Spacing.xs / 2,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  stepperWrap: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  pillChip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  pillChipText: {
    fontFamily: Fonts.body,
    fontSize: 14,
  },
});
