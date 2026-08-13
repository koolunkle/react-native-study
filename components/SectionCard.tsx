import { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Radius, Spacing } from '@/constants/Layout';

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

/** 설정 화면의 알림/습관 관리/앱 정보 섹션 묶음 카드. */
export function SectionCard({ title, children }: SectionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.inkSoft }]}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  content: {
    gap: Spacing.xs,
    borderRadius: Radius.md,
  },
});
