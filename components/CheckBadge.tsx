import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Radius } from '@/constants/Layout';

type CheckBadgeProps = {
  completed: boolean;
};

/** 체크 표시 원. 미체크 → 체크로 바뀔 때만 스프링 바운스로 즉각적 피드백을 준다 (PRD 6-2). */
export function CheckBadge({ completed }: CheckBadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  // useRef(...).current로 초기화하면 렌더 중 ref를 읽게 되어 최신 React 규칙(react-hooks/refs)에
  // 걸린다 — Animated.Value처럼 렌더마다 새로 만들면 안 되는 안정적인 값은 useState의 지연
  // 초기화 함수로 한 번만 생성한다.
  const [scale] = useState(() => new Animated.Value(1));
  const wasCompleted = useRef(completed);

  useEffect(() => {
    if (completed && !wasCompleted.current) {
      scale.setValue(0.6);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
    wasCompleted.current = completed;
  }, [completed, scale]);

  return (
    <Animated.View
      style={[
        styles.check,
        {
          borderColor: colors.hairline,
          backgroundColor: completed ? colors.mintDeep : 'transparent',
          transform: [{ scale }],
        },
      ]}>
      {completed && <Text style={styles.checkMark}>✓</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
