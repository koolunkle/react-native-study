import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Fonts } from '@/constants/Fonts';

/**
 * 설정 — PRD 6-4, 6-1
 * TODO: 알림 on/off(전체/습관별), 습관 개수 제한 단계(새싹/나무/숲/자유),
 *       습관 관리 목록 진입점, 앱 정보.
 */
export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정 ⚙️</Text>
      <Text style={styles.hint}>알림, 습관 관리, 앱 정보</Text>
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
