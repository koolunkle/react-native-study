import { useCallback, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { CheckBadge } from '@/components/CheckBadge';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Radius, Spacing } from '@/constants/Layout';
import { getDayDetail, toggleHabitLog, type DayDetailEntry } from '@/db/habitLogs';
import { todayKey } from '@/lib/date';

type CompletedPopupHabit = { id: number; icon: string; name: string };

/**
 * 홈 (오늘) — PRD 6-2
 */
export default function HomeScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [entries, setEntries] = useState<DayDetailEntry[]>([]);
  const [popupHabit, setPopupHabit] = useState<CompletedPopupHabit | null>(null);
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
    const entry = entries.find((e) => e.habit.id === habitId);
    const wasCompleted = entry?.log?.completed ?? false;

    await toggleHabitLog(db, habitId, today, true);
    await reload();

    if (!wasCompleted && entry) {
      setPopupHabit({ id: entry.habit.id, icon: entry.habit.icon, name: entry.habit.name });
    }
  }

  function openLogEditor(habitId: number) {
    setPopupHabit(null);
    router.push({
      pathname: '/log/[habitId]/[date]',
      params: { habitId: String(habitId), date: today },
    });
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
              <View
                key={habit.id}
                style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                {log?.photoUri ? (
                  <Image source={{ uri: log.photoUri }} style={styles.rowThumb} />
                ) : (
                  <Text style={styles.rowIcon}>{habit.icon}</Text>
                )}
                <Pressable
                  onPress={() => handleToggle(habit.id)}
                  style={styles.rowTextWrap}
                  hitSlop={4}>
                  <Text style={styles.rowName}>{habit.name}</Text>
                  {log?.memo ? (
                    <Text style={styles.rowMemo} numberOfLines={1}>
                      {log.memo}
                    </Text>
                  ) : (
                    <Text style={styles.rowCategory}>{habit.category}</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => openLogEditor(habit.id)} hitSlop={8} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>✏️</Text>
                </Pressable>
                <Pressable onPress={() => handleToggle(habit.id)} hitSlop={4}>
                  <CheckBadge completed={!!log?.completed} />
                </Pressable>
              </View>
            ))}
          </View>
        </>
      )}

      <Modal
        visible={!!popupHabit}
        transparent
        animationType="fade"
        onRequestClose={() => setPopupHabit(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPopupHabit(null)}>
          <Pressable
            style={[styles.popupCard, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.popupTitle}>
              {popupHabit?.icon} {popupHabit?.name} 완료!
            </Text>
            <Text style={[styles.popupBody, { color: colors.inkSoft }]}>
              인증 기록을 남기시겠어요?
            </Text>
            <Pressable
              onPress={() => popupHabit && openLogEditor(popupHabit.id)}
              style={[styles.popupPrimaryBtn, { backgroundColor: colors.mintDeep }]}>
              <Text style={styles.popupPrimaryBtnText}>사진/메모 추가</Text>
            </Pressable>
            <Pressable onPress={() => setPopupHabit(null)} style={styles.popupSecondaryBtn}>
              <Text style={[styles.popupSecondaryBtnText, { color: colors.inkSoft }]}>
                그냥 완료
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  rowThumb: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
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
  rowMemo: {
    fontFamily: Fonts.body,
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  editBtn: {
    paddingHorizontal: 4,
  },
  editBtnText: {
    fontSize: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  popupCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  popupTitle: {
    fontFamily: Fonts.title,
    fontSize: 18,
    textAlign: 'center',
  },
  popupBody: {
    fontFamily: Fonts.body,
    fontSize: 14,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  popupPrimaryBtn: {
    width: '100%',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  popupPrimaryBtnText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: '700',
    color: '#fffdf7',
  },
  popupSecondaryBtn: {
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  popupSecondaryBtnText: {
    fontFamily: Fonts.body,
    fontSize: 14,
  },
});
