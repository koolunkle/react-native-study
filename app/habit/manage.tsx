import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ListRow } from '@/components/ListRow';
import { Text, View } from '@/components/Themed';
import { Fonts } from '@/constants/Fonts';
import { Spacing } from '@/constants/Layout';
import { listActiveHabits, type Habit } from '@/db/habits';
import { getHabitLimitStage } from '@/db/settings';

/**
 * 습관 관리 목록 — PRD 6-1 (설정 → 습관 관리 목록 → 습관 등록/수정)
 */
export default function ManageHabitsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [limitLabel, setLimitLabel] = useState('');

  const reload = useCallback(async () => {
    const [activeHabits, stage] = await Promise.all([listActiveHabits(db), getHabitLimitStage(db)]);
    setHabits(activeHabits);
    setLimitLabel(
      `${activeHabits.length} / ${stage.max === Infinity ? '무제한' : `${stage.max}개`} 사용 중`
    );
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      reload().then(() => {
        if (cancelled) return;
      });
      return () => {
        cancelled = true;
      };
    }, [reload])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>{limitLabel}</Text>

      {habits.length === 0 ? (
        <Text style={styles.emptyHint}>등록된 습관이 없어요</Text>
      ) : (
        <View style={styles.list}>
          {habits.map((habit) => (
            <ListRow
              key={habit.id}
              icon={habit.icon}
              label={habit.name}
              value={habit.category}
              onPress={() => router.push(`/habit/${habit.id}/edit`)}
            />
          ))}
        </View>
      )}

      <ListRow icon="🗂️" label="보관함" onPress={() => router.push('/habit/archive')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  hint: {
    fontFamily: Fonts.num,
    fontSize: 13,
    opacity: 0.6,
  },
  emptyHint: {
    fontFamily: Fonts.body,
    fontSize: 14,
    opacity: 0.6,
  },
  list: {
    gap: Spacing.xs,
  },
});
