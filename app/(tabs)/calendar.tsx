import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Fonts } from '@/constants/Fonts';

/**
 * 캘린더/히스토리 — PRD 6-3
 * TODO: 월별 캘린더 ↔ 타임라인 뷰 전환, 날짜별 습관 아이콘 표시,
 *       습관 필터링, 날짜 클릭 시 app/calendar/[date] 상세로 이동.
 */
export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>캘린더 📅</Text>
      <Text style={styles.hint}>지난 기록을 달력으로 볼 수 있어요</Text>
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
