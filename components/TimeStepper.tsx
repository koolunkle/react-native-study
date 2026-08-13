import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Radius, Spacing } from '@/constants/Layout';

type TimeStepperProps = {
  value: string; // 'HH:MM'
  onChange: (value: string) => void;
};

const MINUTE_STEP = 5;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** habit/new.tsx의 stepperBtn 패턴을 재사용한 시:분 입력. */
export function TimeStepper({ value, onChange }: TimeStepperProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr) || 0;
  const minute = Number(minuteStr) || 0;

  function changeHour(delta: number) {
    const next = (hour + delta + 24) % 24;
    onChange(`${pad(next)}:${pad(minute)}`);
  }

  function changeMinute(delta: number) {
    const next = (minute + delta + 60) % 60;
    onChange(`${pad(hour)}:${pad(next)}`);
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => changeHour(-1)}
        style={[styles.btn, { borderColor: colors.hairline }]}>
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <Text style={[styles.value, { fontFamily: Fonts.num }]}>
        {pad(hour)}:{pad(minute)}
      </Text>
      <Pressable
        onPress={() => changeHour(1)}
        style={[styles.btn, { borderColor: colors.hairline }]}>
        <Text style={styles.btnText}>＋</Text>
      </Pressable>
      <Pressable
        onPress={() => changeMinute(-MINUTE_STEP)}
        style={[styles.btn, { borderColor: colors.hairline }]}>
        <Text style={styles.btnTextSm}>−{MINUTE_STEP}분</Text>
      </Pressable>
      <Pressable
        onPress={() => changeMinute(MINUTE_STEP)}
        style={[styles.btn, { borderColor: colors.hairline }]}>
        <Text style={styles.btnTextSm}>＋{MINUTE_STEP}분</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  btn: {
    height: 36,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 18,
    minWidth: 12,
    textAlign: 'center',
  },
  btnTextSm: {
    fontSize: 12,
  },
  value: {
    fontSize: 16,
    minWidth: 56,
    textAlign: 'center',
  },
});
