import { useCallback, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Radius, Spacing } from '@/constants/Layout';
import { getHabitLog, saveHabitLogDetail } from '@/db/habitLogs';
import { getHabitById, type Habit } from '@/db/habits';
import { formatKoreanDateLong, todayKey } from '@/lib/date';
import { deleteLocalPhoto, persistPickedAsset } from '@/lib/photos';

/**
 * 인증 기록(사진/텍스트) 에디터 — PRD 6-6.
 * 홈(체크 직후)과 캘린더 상세(지난 기록 수정) 양쪽에서 재사용하는 모달.
 */
export default function LogDetailScreen() {
  const { habitId: habitIdParam, date } = useLocalSearchParams<{ habitId: string; date: string }>();
  const habitId = Number(habitIdParam);
  const isToday = date === todayKey();

  const router = useRouter();
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [loaded, setLoaded] = useState(false);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [originalPhotoUri, setOriginalPhotoUri] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [permissionHint, setPermissionHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([getHabitById(db, habitId), getHabitLog(db, habitId, date)]).then(
        ([habitResult, log]) => {
          if (cancelled) return;
          setHabit(habitResult);
          setPhotoUri(log?.photoUri ?? null);
          setOriginalPhotoUri(log?.photoUri ?? null);
          setMemo(log?.memo ?? '');
          setLoaded(true);
        }
      );
      return () => {
        cancelled = true;
      };
    }, [db, habitId, date])
  );

  async function handlePickFromLibrary() {
    setPermissionHint(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPermissionHint('사진 보관함 접근 권한이 필요해요. 기기 설정에서 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: Platform.OS === 'web',
    });
    await applyPickedAsset(result);
  }

  async function handlePickFromCamera() {
    setPermissionHint(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPermissionHint('카메라 접근 권한이 필요해요. 기기 설정에서 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      base64: Platform.OS === 'web',
    });
    await applyPickedAsset(result);
  }

  async function applyPickedAsset(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || !result.assets?.[0]) return;
    setBusy(true);
    try {
      const savedUri = await persistPickedAsset(result.assets[0], { habitId, dateKey: date });
      setPhotoUri(savedUri);
    } finally {
      setBusy(false);
    }
  }

  function handleRemovePhoto() {
    setPhotoUri(null);
  }

  async function handleSave() {
    setBusy(true);
    try {
      if (photoUri !== originalPhotoUri) {
        await deleteLocalPhoto(originalPhotoUri);
      }
      await saveHabitLogDetail(db, habitId, date, { photoUri, memo: memo.trim() || null }, isToday);
      router.back();
    } finally {
      setBusy(false);
    }
  }

  if (!loaded || !habit) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>
          {habit.icon} {habit.name}
        </Text>
        <Text style={[styles.dateLabel, { color: colors.inkSoft }]}>{formatKoreanDateLong(date)}</Text>

        <Text style={styles.label}>사진</Text>
        {photoUri ? (
          <View style={styles.photoWrap}>
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            <View style={styles.photoActions}>
              <Pressable
                onPress={handlePickFromLibrary}
                style={[styles.pillChip, { borderColor: colors.hairline }]}>
                <Text style={styles.pillChipText}>다시 선택</Text>
              </Pressable>
              <Pressable
                onPress={handleRemovePhoto}
                style={[styles.pillChip, { borderColor: colors.apricotDeep }]}>
                <Text style={[styles.pillChipText, { color: colors.apricotDeep }]}>삭제</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.wrapRow}>
            <Pressable
              onPress={handlePickFromLibrary}
              style={[styles.pillChip, { borderColor: colors.hairline, backgroundColor: colors.surface }]}>
              <Text style={styles.pillChipText}>🖼️ 갤러리에서 선택</Text>
            </Pressable>
            <Pressable
              onPress={handlePickFromCamera}
              style={[styles.pillChip, { borderColor: colors.hairline, backgroundColor: colors.surface }]}>
              <Text style={styles.pillChipText}>📷 카메라로 촬영</Text>
            </Pressable>
          </View>
        )}
        {permissionHint && (
          <Text style={[styles.hint, { color: colors.apricotDeep }]}>{permissionHint}</Text>
        )}

        <Text style={styles.label}>메모 (선택)</Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="오늘 기록에 대한 짧은 메모"
          placeholderTextColor={colors.inkSoft}
          multiline
          style={[
            styles.input,
            styles.memoInput,
            { color: colors.text, borderColor: colors.hairline },
          ]}
        />

        <Pressable
          onPress={handleSave}
          disabled={busy}
          style={[styles.saveBtn, { backgroundColor: colors.mintDeep, opacity: busy ? 0.6 : 1 }]}>
          <Text style={styles.saveBtnText}>{busy ? '저장 중...' : '저장하기'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  header: {
    fontFamily: Fonts.title,
    fontSize: 20,
  },
  dateLabel: {
    fontFamily: Fonts.num,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  pillChip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  pillChipText: {
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  photoWrap: {
    gap: Spacing.xs,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
  },
  photoActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  memoInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  saveBtnText: {
    fontFamily: Fonts.body,
    fontSize: 17,
    fontWeight: '700',
    color: '#fffdf7',
  },
});
