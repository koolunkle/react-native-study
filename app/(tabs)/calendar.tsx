import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Radius, Spacing } from '@/constants/Layout';
import { getMonthLogSummary, getMonthTimeline, type TimelineDayEntry } from '@/db/habitLogs';
import { listActiveHabits, type Habit } from '@/db/habits';
import {
  WEEKDAY_LABELS_KO,
  formatKoreanDayWeekday,
  formatKoreanMonth,
  getMonthGrid,
  todayKey,
} from '@/lib/date';

type ViewMode = 'calendar' | 'list';

/**
 * 캘린더/히스토리 — PRD 6-3
 */
export default function CalendarScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitIds, setSelectedHabitIds] = useState<number[]>([]);
  const [summary, setSummary] = useState<Record<string, string[]>>({});
  const [timeline, setTimeline] = useState<TimelineDayEntry[]>([]);

  const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
  const today = todayKey();

  function toggleHabitFilter(habitId: number) {
    setSelectedHabitIds((prev) =>
      prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
    );
  }

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const filterIds = selectedHabitIds.length > 0 ? selectedHabitIds : undefined;
      Promise.all([
        listActiveHabits(db),
        getMonthLogSummary(db, yearMonth, filterIds),
        getMonthTimeline(db, yearMonth, today, filterIds),
      ]).then(([habitsResult, summaryResult, timelineResult]) => {
        if (cancelled) return;
        setHabits(habitsResult);
        setSummary(summaryResult);
        setTimeline(timelineResult);
      });
      return () => {
        cancelled = true;
      };
    }, [db, yearMonth, today, selectedHabitIds])
  );

  function goPrevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const grid = getMonthGrid(year, month);
  const weeks = Array.from({ length: 6 }, (_, i) => grid.slice(i * 7, i * 7 + 7));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={goPrevMonth} hitSlop={12}>
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{formatKoreanMonth(year, month)}</Text>
        <Pressable onPress={goNextMonth} hitSlop={12}>
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.viewToggleRow}>
        {(
          [
            { key: 'calendar', label: '캘린더' },
            { key: 'list', label: '리스트' },
          ] as const
        ).map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => setViewMode(opt.key)}
            style={[
              styles.viewToggleBtn,
              {
                backgroundColor: viewMode === opt.key ? colors.apricot : colors.surface,
                borderColor: viewMode === opt.key ? colors.apricotDeep : colors.hairline,
              },
            ]}>
            <Text style={styles.viewToggleText}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      {habits.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}>
          <Pressable
            onPress={() => setSelectedHabitIds([])}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedHabitIds.length === 0 ? colors.lavender : colors.surface,
                borderColor: selectedHabitIds.length === 0 ? colors.lavenderDeep : colors.hairline,
              },
            ]}>
            <Text style={styles.filterChipText}>전체</Text>
          </Pressable>
          {habits.map((habit) => {
            const active = selectedHabitIds.includes(habit.id);
            return (
              <Pressable
                key={habit.id}
                onPress={() => toggleHabitFilter(habit.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.lavender : colors.surface,
                    borderColor: active ? colors.lavenderDeep : colors.hairline,
                  },
                ]}>
                <Text style={styles.filterChipText}>
                  {habit.icon} {habit.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {viewMode === 'calendar' ? (
        <>
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS_KO.map((label) => (
              <Text key={label} style={styles.weekdayLabel}>
                {label}
              </Text>
            ))}
          </View>

          {weeks.map((week, i) => (
            <View key={i} style={styles.weekRow}>
              {week.map((day) => {
                const icons = summary[day.dateKey] ?? [];
                const isToday = day.dateKey === today;
                return (
                  <Pressable
                    key={day.dateKey}
                    onPress={() => router.push(`/calendar/${day.dateKey}`)}
                    style={[
                      styles.dayCell,
                      isToday && { borderColor: colors.mintDeep, borderWidth: 1.5 },
                    ]}>
                    <Text
                      style={[
                        styles.dayNumber,
                        !day.inCurrentMonth && { color: colors.inkSoft, opacity: 0.4 },
                      ]}>
                      {day.date.getDate()}
                    </Text>
                    <View style={styles.iconRow}>
                      {icons.slice(0, 3).map((icon, idx) => (
                        <Text key={idx} style={styles.dayIcon}>
                          {icon}
                        </Text>
                      ))}
                      {icons.length > 3 && (
                        <Text style={[styles.dayIconMore, { color: colors.inkSoft }]}>
                          +{icons.length - 3}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {timeline.length === 0 ? (
            <Text style={styles.listEmptyHint}>이 달에 기록이 없어요</Text>
          ) : (
            timeline.map((day) => (
              <Pressable
                key={day.date}
                onPress={() => router.push(`/calendar/${day.date}`)}
                style={[
                  styles.dayBlock,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}>
                <Text style={styles.dayBlockHeader}>{formatKoreanDayWeekday(day.date)}</Text>
                <View style={styles.chipRow}>
                  {day.entries.map((entry) => (
                    <View
                      key={entry.habitId}
                      style={[
                        styles.entryChip,
                        {
                          borderColor: entry.completed ? colors.mintDeep : colors.hairline,
                          backgroundColor: entry.completed ? colors.mint : 'transparent',
                        },
                      ]}>
                      <Text style={styles.entryChipText}>
                        {entry.icon} {entry.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  navArrow: {
    fontSize: 24,
    paddingHorizontal: Spacing.sm,
  },
  monthTitle: {
    fontFamily: Fonts.title,
    fontSize: 20,
    minWidth: 120,
    textAlign: 'center',
  },
  viewToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  viewToggleBtn: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  viewToggleText: {
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  filterChipText: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xs,
  },
  listEmptyHint: {
    fontFamily: Fonts.body,
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  dayBlock: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  dayBlockHeader: {
    fontFamily: Fonts.num,
    fontSize: 13,
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  entryChip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  entryChipText: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: Fonts.num,
    fontSize: 12,
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    width: `${100 / 7}%`,
    minHeight: 56,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  dayNumber: {
    fontFamily: Fonts.num,
    fontSize: 13,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 2,
  },
  dayIcon: {
    fontSize: 11,
  },
  dayIconMore: {
    fontFamily: Fonts.num,
    fontSize: 10,
    marginLeft: 2,
  },
});
