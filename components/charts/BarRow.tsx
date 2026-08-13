import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Spacing } from '@/constants/Layout';

type BarRowProps = {
  icon?: string;
  label: string;
  percent: number; // 0-100
  color: string;
};

/** 습관별/요일별 달성률 막대 (PRD 6-5) — 홈 화면 진행률 바와 동일한 시각 언어. */
export function BarRow({ icon, label, percent, color }: BarRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label} numberOfLines={1}>
          {icon ? `${icon} ` : ''}
          {label}
        </Text>
        <Text style={[styles.percentText, { fontFamily: Fonts.num }]}>{Math.round(clamped)}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.hairline }]}>
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  percentText: {
    fontSize: 13,
    opacity: 0.7,
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
