import { type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Radius, Spacing } from '@/constants/Layout';

type ListRowProps = {
  icon?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
};

/** 설정/습관 관리 화면에서 공용으로 쓰는 탭 가능한 행. */
export function ListRow({ icon, label, value, onPress, right, danger }: ListRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.label, danger && { color: colors.apricotDeep }]}>{label}</Text>
      {value && (
        <Text style={[styles.value, { color: danger ? colors.apricotDeep : colors.inkSoft }]}>
          {value}
        </Text>
      )}
      {right}
      {onPress && !right && <Text style={[styles.chevron, { color: colors.inkSoft }]}>›</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  value: {
    fontFamily: Fonts.num,
    fontSize: 14,
  },
  chevron: {
    fontSize: 18,
  },
});
