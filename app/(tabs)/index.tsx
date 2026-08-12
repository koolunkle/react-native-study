import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Radius, Spacing } from '@/constants/Layout';
import { getDayDetail, toggleHabitLog, type DayDetailEntry } from '@/db/habitLogs';
import { todayKey } from '@/lib/date';

/**
 * 홈 (오늘) — PRD 6-2
 * TODO: 체크 시 "인증 기록을 남기시겠어요?" 선택 팝업 (PRD 6-6, 사진/메모 — 이미지 피커 연동 필요).
 */
export default function HomeScreen() {
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [entries, setEntries] = useState<DayDetailEntry[]>([]);
  const today = todayKey();

  const reload = useCallback(() => {
    return getDayDetail(db, today).then(setEntries);
  }, [db, today]);

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

  async function handleToggle(habitId: number) {
    await toggleHabitLog(db, habitId, today, true);
    await reload();
  }

  const total = entries.length;
  const completedCount = entries.filter((e) => e.log?.completed).length;
  const remaining = total - completedCount;
  const progressPct = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘 🌤️</Text>

      {total === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.hint}>아직 등록된 습관이 없어요</Text>
          <Text style={styles.hint}>오른쪽 위 + 버튼으로 첫 습관을 등록해보세요</Text>
        </View>
      ) : (
        <>
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: colors.hairline }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPct}%`, backgroundColor: colors.mintDeep },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {remaining === 0
                ? '오늘 습관을 모두 완료했어요 🎉'
                : `오늘 ${total}개 중 ${remaining}개 남았어요`}
            </Text>
          </View>

          <View style={styles.list}>
            {entries.map(({ habit, log }) => (
              <Pressable
                key={habit.id}
                onPress={() => handleToggle(habit.id)}
                style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <Text style={styles.rowIcon}>{habit.icon}</Text>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowName}>{habit.name}</Text>
                  <Text style={styles.rowCategory}>{habit.category}</Text>
                </View>
                <View
                  style={[
                    styles.check,
                    {
                      borderColor: colors.hairline,
                      backgroundColor: log?.completed ? colors.mintDeep : 'transparent',
                    },
                  ]}>
                  {log?.completed && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </Pressable>
            ))}
          </View>
        </>
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
  progressSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 10,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  progressLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    opacity: 0.7,
    marginTop: Spacing.xs,
    textAlign: 'center',
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
  check: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fffdf7',
    fontSize: 15,
  },
});
