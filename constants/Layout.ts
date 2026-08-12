/**
 * 간격/라운드 스케일. 값 자체는 DESIGN.md 토큰(8px 기반)을 따르되,
 * 이름 없는 세부 값은 PRD의 손그림/카드형 톤에 맞춰 라운드를 살짝 키웠다.
 */
export const Spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 96,
} as const;

export const Radius = {
  sm: 8,
  md: 16,
  lg: 28,
  pill: 999,
} as const;
