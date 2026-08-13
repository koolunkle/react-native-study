import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { Text, View } from '@/components/Themed';
import { TimeStepper } from '@/components/TimeStepper';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Radius, Spacing } from '@/constants/Layout';
import { HABIT_CATEGORIES, HABIT_ICONS } from '@/constants/HabitOptions';
import { archiveHabit, getHabitById, updateHabit, type RepeatType } from '@/db/habits';
import { getAppSettings } from '@/db/settings';
import { cancelHabitReminder, scheduleHabitReminder } from '@/lib/notifications';

/**
 * 습관 수정 / 그만두기(보관) — PRD 6-1
 */
export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = Number(id);
  const router = useRouter();
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [repeatType, setRepeatType] = useState<RepeatType>('daily');
  const [repeatCount, setRepeatCount] = useState(3);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('21:00');
  const [notifGlobalEnabled, setNotifGlobalEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([getHabitById(db, habitId), getAppSettings(db)]).then(([habit, settings]) => {
        if (cancelled || !habit) return;
        setName(habit.name);
        setIcon(habit.icon);
        setCategory(habit.category);
        setMemo(habit.memo ?? '');
        setRepeatType(habit.repeatType);
        setRepeatCount(habit.repeatCount ?? 3);
        setReminderEnabled(habit.reminderEnabled);
        setReminderTime(habit.reminderTime ?? '21:00');
        setNotifGlobalEnabled(settings.notifGlobalEnabled);
        setLoaded(true);
      });
      return () => {
        cancelled = true;
      };
    }, [db, habitId])
  );

  async function handleSave() {
    if (!name.trim()) {
      setError('습관 이름을 입력해주세요');
      return;
    }
    if (!icon) {
      setError('아이콘을 선택해주세요');
      return;
    }
    if (!category) {
      setError('카테고리를 선택해주세요');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateHabit(db, habitId, {
        name: name.trim(),
        icon,
        category,
        memo: memo.trim() || null,
        repeatType,
        repeatCount: repeatType === 'weekly_n' ? repeatCount : null,
        reminderTime,
        reminderEnabled,
      });
      const habit = await getHabitById(db, habitId);
      if (habit) {
        await scheduleHabitReminder(habit, notifGlobalEnabled);
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function handleArchive() {
    Alert.alert('그만두기', `"${name}"을(를) 그만둘까요? 지난 기록은 캘린더/통계에 남아있어요.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '그만두기',
        style: 'destructive',
        onPress: async () => {
          await cancelHabitReminder(habitId);
          await archiveHabit(db, habitId);
          router.back();
        },
      },
    ]);
  }

  if (!loaded) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>습관 이름</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="예: 아침 운동"
          placeholderTextColor={colors.inkSoft}
          style={[styles.input, { color: colors.text, borderColor: colors.hairline }]}
        />

        <Text style={styles.label}>아이콘</Text>
        <View style={styles.wrapRow}>
          {HABIT_ICONS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => setIcon(emoji)}
              style={[
                styles.iconChip,
                {
                  backgroundColor: icon === emoji ? colors.mint : colors.surface,
                  borderColor: icon === emoji ? colors.mintDeep : colors.hairline,
                },
              ]}>
              <Text style={styles.iconChipText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>카테고리</Text>
        <View style={styles.wrapRow}>
          {HABIT_CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => setCategory(c.label)}
              style={[
                styles.pillChip,
                {
                  backgroundColor: category === c.label ? colors.lavender : colors.surface,
                  borderColor: category === c.label ? colors.lavenderDeep : colors.hairline,
                },
              ]}>
              <Text style={styles.pillChipText}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>반복 주기</Text>
        <View style={styles.wrapRow}>
          <Pressable
            onPress={() => setRepeatType('daily')}
            style={[
              styles.pillChip,
              {
                backgroundColor: repeatType === 'daily' ? colors.apricot : colors.surface,
                borderColor: repeatType === 'daily' ? colors.apricotDeep : colors.hairline,
              },
            ]}>
            <Text style={styles.pillChipText}>매일</Text>
          </Pressable>
          <Pressable
            onPress={() => setRepeatType('weekly_n')}
            style={[
              styles.pillChip,
              {
                backgroundColor: repeatType === 'weekly_n' ? colors.apricot : colors.surface,
                borderColor: repeatType === 'weekly_n' ? colors.apricotDeep : colors.hairline,
              },
            ]}>
            <Text style={styles.pillChipText}>주 N회</Text>
          </Pressable>
        </View>

        {repeatType === 'weekly_n' && (
          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => setRepeatCount((n) => Math.max(1, n - 1))}
              style={[styles.stepperBtn, { borderColor: colors.hairline }]}>
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={[styles.stepperValue, { fontFamily: Fonts.num }]}>
              주 {repeatCount}회
            </Text>
            <Pressable
              onPress={() => setRepeatCount((n) => Math.min(7, n + 1))}
              style={[styles.stepperBtn, { borderColor: colors.hairline }]}>
              <Text style={styles.stepperBtnText}>＋</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.label}>메모 (선택)</Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="습관에 대한 짧은 메모"
          placeholderTextColor={colors.inkSoft}
          multiline
          style={[
            styles.input,
            styles.memoInput,
            { color: colors.text, borderColor: colors.hairline },
          ]}
        />

        <View style={styles.reminderHeader}>
          <Text style={styles.label}>리마인더</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ true: colors.mintDeep, false: colors.hairline }}
            thumbColor={colors.surface}
          />
        </View>
        {reminderEnabled && (
          <View style={[styles.stepperWrap, { borderColor: colors.hairline }]}>
            <TimeStepper value={reminderTime} onChange={setReminderTime} />
            {!notifGlobalEnabled && (
              <Text style={[styles.reminderHint, { color: colors.apricotDeep }]}>
                설정에서 전체 알림을 켜야 리마인더가 울려요
              </Text>
            )}
          </View>
        )}

        {error && <Text style={[styles.error, { color: colors.apricotDeep }]}>{error}</Text>}

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: colors.mintDeep, opacity: saving ? 0.6 : 1 }]}>
          <Text style={styles.saveBtnText}>{saving ? '저장 중...' : '저장하기'}</Text>
        </Pressable>

        <Pressable
          onPress={handleArchive}
          style={[styles.archiveBtn, { borderColor: colors.apricotDeep }]}>
          <Text style={[styles.archiveBtnText, { color: colors.apricotDeep }]}>그만두기</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  memoInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipText: {
    fontSize: 22,
  },
  pillChip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  pillChipText: {
    fontFamily: Fonts.body,
    fontSize: 15,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 18,
  },
  stepperValue: {
    fontSize: 16,
    minWidth: 72,
    textAlign: 'center',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  stepperWrap: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  reminderHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  error: {
    fontFamily: Fonts.body,
    fontSize: 14,
    marginTop: Spacing.md,
  },
  saveBtn: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveBtnText: {
    fontFamily: Fonts.body,
    fontSize: 17,
    fontWeight: '700',
    color: '#fffdf7',
  },
  archiveBtn: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  archiveBtnText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '700',
  },
});
