import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Fonts } from '@/constants/Fonts';

/**
 * 홈 (오늘) — PRD 6-2
 * TODO: 오늘 진행률 프로그레스 바, 습관 체크 리스트, 체크 애니메이션,
 *       "인증 기록 남기시겠어요?" 선택 팝업.
 */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘 🌤️</Text>
      <Text style={styles.hint}>오늘 체크할 습관이 여기에 표시돼요</Text>
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
