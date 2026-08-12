/**
 * PRD 6-1 습관 등록 폼에서 쓰는 사전 정의 옵션.
 * category는 스키마상 자유 TEXT라 나중에 추가/변경해도 마이그레이션이 필요 없다.
 */
export const HABIT_ICONS = [
  '🏃', '🚶', '🧘', '💧', '🥗', '😴', '🚭', '🚫',
  '📖', '✍️', '💻', '🎨', '🎵', '🧹', '💰', '🙏',
] as const;

export const HABIT_CATEGORIES = [
  { key: 'health', label: '건강' },
  { key: 'study', label: '공부' },
  { key: 'etc', label: '기타' },
] as const;

/** PRD 6-1 습관 개수 제한 단계. 설정 화면에서 단계 선택이 구현되기 전까지는 기본값(1단계)만 적용. */
export const HABIT_LIMIT_STAGES = [
  { level: 1, name: '🌱 새싹', max: 3 },
  { level: 2, name: '🌿 나무', max: 5 },
  { level: 3, name: '🌳 숲', max: 7 },
  { level: 4, name: '♾️ 자유', max: Infinity },
] as const;

export const DEFAULT_HABIT_LIMIT = HABIT_LIMIT_STAGES[0];
