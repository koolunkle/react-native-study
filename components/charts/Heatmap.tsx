import { ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Spacing } from '@/constants/Layout';
import { type DayCompletionSummary } from '@/db/stats';
import { WEEKDAY_LABELS_KO } from '@/lib/date';

type HeatmapProps = {
  data: DayCompletionSummary[]; // 날짜 오름차순, 연속된 날짜라고 가정
};

const CELL_SIZE = 14;
const CELL_GAP = 3;

function dayOfWeek(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** 누적 기록 히트맵 (PRD 6-5, 잔디밭 스타일) — 곡선이 필요 없어 일반 View로 구현. */
export function Heatmap({ data }: HeatmapProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  if (data.length === 0) return null;

  const leadingBlanks = dayOfWeek(data[0].date);
  const cells: (DayCompletionSummary | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...data,
  ];
  const weekCount = Math.ceil(cells.length / 7);
  const weeks = Array.from({ length: weekCount }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  function cellStyle(day: DayCompletionSummary | null) {
    if (!day || day.total === 0) return { backgroundColor: colors.hairline, opacity: 1 };
    if (day.rate === 0) return { backgroundColor: colors.mintDeep, opacity: 0.15 };
    if (day.rate < 0.5) return { backgroundColor: colors.mintDeep, opacity: 0.4 };
    if (day.rate < 0.75) return { backgroundColor: colors.mintDeep, opacity: 0.7 };
    return { backgroundColor: colors.mintDeep, opacity: 1 };
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.weekdayColumn}>
        {WEEKDAY_LABELS_KO.map((label, i) => (
          <Text key={label} style={[styles.weekdayLabel, { opacity: i % 2 === 0 ? 0.6 : 0 }]}>
            {label}
          </Text>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.weeksRow}>
          {weeks.map((week, wIdx) => (
            <View key={wIdx} style={styles.weekColumn}>
              {week.map((day, dIdx) => (
                <View key={dIdx} style={[styles.cell, cellStyle(day)]} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  weekdayColumn: {
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  weekdayLabel: {
    fontFamily: Fonts.num,
    fontSize: 9,
    height: CELL_SIZE,
    lineHeight: CELL_SIZE,
  },
  weeksRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekColumn: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
  },
});
