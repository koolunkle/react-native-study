import { useCallback, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ListRow } from '@/components/ListRow';
import { Text, View } from '@/components/Themed';
import { Fonts } from '@/constants/Fonts';
import { Spacing } from '@/constants/Layout';
import { deleteHabit, listArchivedHabits, type Habit } from '@/db/habits';
import { cancelHabitReminder } from '@/lib/notifications';

/**
 * 보관함 — PRD 6-1. 그만둔(보관된) 습관의 완전 삭제 전용 화면. 되돌릴 수 없음.
 */
export default function ArchiveScreen() {
  const db = useSQLiteContext();
  const [habits, setHabits] = useState<Habit[]>([]);

  const reload = useCallback(() => {
    return listArchivedHabits(db).then(setHabits);
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

  function confirmDelete(habit: Habit) {
    Alert.alert(
      '완전 삭제',
      `"${habit.name}"을(를) 완전히 삭제할까요? 지난 기록도 함께 삭제되며, 되돌릴 수 없어요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await cancelHabitReminder(habit.id);
            await deleteHabit(db, habit.id);
            await reload();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {habits.length === 0 ? (
        <Text style={styles.emptyHint}>그만둔 습관이 없어요</Text>
      ) : (
        <View style={styles.list}>
          {habits.map((habit) => (
            <ListRow
              key={habit.id}
              icon={habit.icon}
              label={habit.name}
              value="완전 삭제"
              danger
              onPress={() => confirmDelete(habit)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
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
