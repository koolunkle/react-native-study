import { StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text, View } from '@/components/Themed';
import { Fonts } from '@/constants/Fonts';

type DonutProps = {
  percent: number; // 0-100
  size?: number;
  strokeWidth?: number;
  trackColor: string;
  fillColor: string;
};

/** 통계 화면의 전체 평균 달성률 도넛그래프 (PRD 6-5). */
export function Donut({ percent, size = 140, strokeWidth = 14, trackColor, fillColor }: DonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.labelWrap}>
        <Text style={styles.percentText}>{Math.round(clamped)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  percentText: {
    fontFamily: Fonts.num,
    fontSize: 26,
    fontWeight: '700',
  },
});
