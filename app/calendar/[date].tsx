import { StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { Fonts } from '@/constants/Fonts';

/**
 * 캘린더 날짜별 상세 — PRD 6-3
 * TODO: 해당 날짜 습관 목록 + 완료 여부 + 사진/텍스트 인증 기록 표시,
 *       지난 기록 수정("수정됨" 표시 남김).
 */
export default function CalendarDayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{date} 기록</Text>
      <Text style={styles.hint}>그날의 습관 기록을 볼 수 있어요</Text>
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
    fontSize: 22,
    fontFamily: Fonts.title,
  },
  hint: {
    fontSize: 14,
    fontFamily: Fonts.body,
    opacity: 0.6,
  },
});
