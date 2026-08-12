import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Radius, Spacing } from '@/constants/Layout';
import { listActiveHabits, type Habit } from '@/db/habits';

/**
 * 홈 (오늘) — PRD 6-2
 * 지금은 등록된 습관을 목록으로만 보여준다 (체크 기능/진행률 바는 다음 단계).
 * TODO: 오늘 진행률 프로그레스 바, 체크 애니메이션,
 *       "인증 기록 남기시겠어요?" 선택 팝업.
 */
export default function HomeScreen() {
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [habits, setHabits] = useState<Habit[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listActiveHabits(db).then((rows) => {
        if (!cancelled) setHabits(rows);
      });
      return () => {
        cancelled = true;
      };
    }, [db])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘 🌤️</Text>

      {habits.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.hint}>아직 등록된 습관이 없어요</Text>
          <Text style={styles.hint}>오른쪽 위 + 버튼으로 첫 습관을 등록해보세요</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <Text style={styles.rowIcon}>{item.icon}</Text>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowCategory}>{item.category}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.title,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  hint: {
    fontSize: 14,
    fontFamily: Fonts.body,
    opacity: 0.6,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  rowIcon: {
    fontSize: 24,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowName: {
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  rowCategory: {
    fontFamily: Fonts.num,
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});
