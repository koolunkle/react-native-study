import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Fonts } from '@/constants/Fonts';

/**
 * 통계 — PRD 6-5
 * TODO: 도넛(전체 평균) + 막대(습관별/요일별) + 히트맵(누적), 기간 선택(주간/월간/전체).
 */
export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>통계 📊</Text>
      <Text style={styles.hint}>주간·월간·전체 달성률을 볼 수 있어요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.title,
  },
  hint: {
    fontSize: 14,
    fontFamily: Fonts.body,
    opacity: 0.6,
  },
});
