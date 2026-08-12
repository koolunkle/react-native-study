import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Radius, Spacing } from '@/constants/Layout';
import { getDayDetail, toggleHabitLog, type DayDetailEntry } from '@/db/habitLogs';
import { formatKoreanDateLong, todayKey } from '@/lib/date';

/**
 * 캘린더 날짜별 상세 — PRD 6-3
 * TODO: 사진/텍스트 인증 기록 추가·수정 UI (PRD 6-6, expo-image-picker 연동).
 */
export default function CalendarDayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [entries, setEntries] = useState<DayDetailEntry[]>([]);
  const isToday = date === todayKey();

  const reload = useCallback(() => {
    return getDayDetail(db, date).then(setEntries);
  }, [db, date]);

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

  async function handleToggle(habitId: number) {
    await toggleHabitLog(db, habitId, date, isToday);
    await reload();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.dateTitle}>{formatKoreanDateLong(date)}</Text>

      {entries.length === 0 ? (
        <Text style={styles.hint}>그날 기준으로 존재하는 습관이 없어요</Text>
      ) : (
        <View style={styles.list}>
          {entries.map(({ habit, log }) => (
            <Pressable
              key={habit.id}
              onPress={() => handleToggle(habit.id)}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <Text style={styles.rowIcon}>{habit.icon}</Text>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowName}>{habit.name}</Text>
                {(log?.memo || log?.photoUri) && (
                  <Text style={styles.rowMemo} numberOfLines={1}>
                    {log?.photoUri ? '📷 ' : ''}
                    {log?.memo ?? ''}
                  </Text>
                )}
                {log?.editedAt && <Text style={styles.editedBadge}>수정됨</Text>}
              </View>
              <View
                style={[
                  styles.check,
                  {
                    borderColor: colors.hairline,
                    backgroundColor: log?.completed ? colors.mintDeep : 'transparent',
                  },
                ]}>
                {log?.completed && <Text style={styles.checkMark}>✓</Text>}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  dateTitle: {
    fontFamily: Fonts.title,
    fontSize: 22,
    marginBottom: Spacing.md,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 14,
    opacity: 0.6,
  },
  list: {
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  rowIcon: {
    fontSize: 24,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowName: {
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  rowMemo: {
    fontFamily: Fonts.body,
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  editedBadge: {
    fontFamily: Fonts.num,
    fontSize: 11,
    opacity: 0.5,
    marginTop: 2,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fffdf7',
    fontSize: 15,
  },
});
