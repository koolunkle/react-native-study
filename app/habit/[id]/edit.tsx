import { StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { Fonts } from '@/constants/Fonts';

/**
 * 습관 수정 / 그만두기(보관) / 완전 삭제 — PRD 6-1
 * TODO: new.tsx와 동일한 입력 폼 + 보관(목록에서만 숨김) 액션,
 *       보관함에서의 완전 삭제(되돌릴 수 없음 경고) 액션.
 */
export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>습관 수정 ✏️</Text>
      <Text style={styles.hint}>
        habit id: <Text style={styles.num}>{id}</Text>
      </Text>
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
  num: {
    fontFamily: Fonts.num,
  },
});
