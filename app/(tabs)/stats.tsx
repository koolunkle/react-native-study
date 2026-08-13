import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { BarRow } from '@/components/charts/BarRow';
import { Donut } from '@/components/charts/Donut';
import { Heatmap } from '@/components/charts/Heatmap';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Radius, Spacing } from '@/constants/Layout';
import {
  getAllTimeStart,
  getHeatmapData,
  getOverallCompletionRate,
  getPerHabitCompletionRate,
  getWeekdayCompletionRate,
  type CompletionSummary,
  type DayCompletionSummary,
  type HabitCompletionSummary,
  type WeekdayCompletionSummary,
} from '@/db/stats';
import { getPeriodRange, todayKey, WEEKDAY_LABELS_KO, type StatsPeriod } from '@/lib/date';

const PERIOD_OPTIONS: { key: StatsPeriod; label: string }[] = [
  { key: 'week', label: '주간' },
  { key: 'month', label: '월간' },
  { key: 'all', label: '전체' },
];

const EMPTY_SUMMARY: CompletionSummary = { completed: 0, total: 0, rate: 0 };

/**
 * 통계 — PRD 6-5
 */
export default function StatsScreen() {
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [hasAnyHabit, setHasAnyHabit] = useState(true);
  const [overall, setOverall] = useState<CompletionSummary>(EMPTY_SUMMARY);
  const [perHabit, setPerHabit] = useState<HabitCompletionSummary[]>([]);
  const [weekday, setWeekday] = useState<WeekdayCompletionSummary[]>([]);
  const [heatmap, setHeatmap] = useState<DayCompletionSummary[]>([]);

  const reload = useCallback(async () => {
    const allTimeStart = await getAllTimeStart(db);
    if (!allTimeStart) {
      setHasAnyHabit(false);
      return;
    }
    setHasAnyHabit(true);

    const resolved = getPeriodRange(period, todayKey(), allTimeStart);
    const range = { start: resolved.start ?? allTimeStart, end: resolved.end };

    const [overallRes, perHabitRes, weekdayRes, heatmapRes] = await Promise.all([
      getOverallCompletionRate(db, range),
      getPerHabitCompletionRate(db, range),
      getWeekdayCompletionRate(db, range),
      getHeatmapData(db, range),
    ]);
    setOverall(overallRes);
    setPerHabit(perHabitRes);
    setWeekday(weekdayRes);
    setHeatmap(heatmapRes);
  }, [db, period]);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>통계 📊</Text>

      <View style={styles.segmentRow}>
        {PERIOD_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => setPeriod(opt.key)}
            style={[
              styles.segment,
              {
                backgroundColor: period === opt.key ? colors.apricot : colors.surface,
                borderColor: period === opt.key ? colors.apricotDeep : colors.hairline,
              },
            ]}>
            <Text style={styles.segmentText}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      {!hasAnyHabit ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.hint}>습관을 등록하면 통계를 볼 수 있어요</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.donutSection}>
            <Donut percent={overall.rate * 100} trackColor={colors.hairline} fillColor={colors.mintDeep} />
            <Text style={styles.donutLabel}>
              전체 평균 달성률 · {overall.completed}/{overall.total}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>습관별 달성률</Text>
          {perHabit.length === 0 ? (
            <Text style={styles.hint}>해당 기간에 존재한 습관이 없어요</Text>
          ) : (
            perHabit.map((h) => (
              <BarRow
                key={h.habitId}
                icon={h.icon}
                label={h.name}
                percent={h.rate * 100}
                color={colors.lavenderDeep}
              />
            ))
          )}

          <Text style={styles.sectionTitle}>요일별 달성률</Text>
          {weekday.map((w) => (
            <BarRow
              key={w.weekday}
              label={WEEKDAY_LABELS_KO[w.weekday]}
              percent={w.rate * 100}
              color={colors.apricotDeep}
            />
          ))}

          <Text style={styles.sectionTitle}>누적 기록</Text>
          <Heatmap data={heatmap} />
        </ScrollView>
      )}
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
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  segment: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  segmentText: {
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 14,
    fontFamily: Fonts.body,
    opacity: 0.6,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  donutSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  donutLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    opacity: 0.7,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
