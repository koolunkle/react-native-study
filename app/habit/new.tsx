import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Fonts } from '@/constants/Fonts';

/**
 * 습관 등록 — PRD 6-1
 * TODO: 이름(필수), 아이콘(필수, 이모지 목록), 카테고리(필수), 메모(선택),
 *       반복 주기(매일/주 N회) 입력 폼. 단계별 습관 개수 제한 체크.
 */
export default function NewHabitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>새 습관 등록 🌱</Text>
      <Text style={styles.hint}>이름 · 아이콘 · 카테고리를 정해요</Text>
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
