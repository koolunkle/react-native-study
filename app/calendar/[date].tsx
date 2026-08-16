import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
 */
export default function CalendarDayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
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
            <View
              key={habit.id}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              {log?.photoUri ? (
                <Image source={{ uri: log.photoUri }} style={styles.rowThumb} />
              ) : (
                <Text style={styles.rowIcon}>{habit.icon}</Text>
              )}
              <Pressable onPress={() => handleToggle(habit.id)} style={styles.rowTextWrap} hitSlop={4}>
                <Text style={styles.rowName}>{habit.name}</Text>
                {log?.memo && (
                  <Text style={styles.rowMemo} numberOfLines={1}>
                    {log.memo}
                  </Text>
                )}
                {log?.editedAt && <Text style={styles.editedBadge}>수정됨</Text>}
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/log/[habitId]/[date]',
                    params: { habitId: String(habit.id), date },
                  })
                }
                hitSlop={8}
                style={styles.editBtn}>
                <Text style={styles.editBtnText}>✏️</Text>
              </Pressable>
              <Pressable onPress={() => handleToggle(habit.id)} hitSlop={4}>
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
            </View>
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
  rowThumb: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
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
  editBtn: {
    paddingHorizontal: 4,
  },
  editBtnText: {
    fontSize: 16,
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
