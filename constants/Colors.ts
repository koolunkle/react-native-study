/**
 * Happy Habit 컬러 팔레트
 * PRD.md 7절(디자인 가이드) + DESIGN.md 토큰 구조를 이식.
 * 파스텔(민트/라벤더/살구/크림) 기본 + 저채도 다크모드 팔레트.
 */

const palette = {
  light: {
    mint: '#c9e8d1',
    mintDeep: '#7fc793',
    lavender: '#ded2f7',
    lavenderDeep: '#a98ee8',
    apricot: '#f8d9bb',
    apricotDeep: '#eda874',
    cream: '#f7efdd',
    canvas: '#fffdf7',
    surface: '#ffffff',
    ink: '#3c3226',
    inkSoft: '#8a7c68',
    hairline: '#ece2cd',
  },
  dark: {
    mint: '#3f5c4b',
    mintDeep: '#6fae86',
    lavender: '#463d5e',
    lavenderDeep: '#9884d6',
    apricot: '#5a4433',
    apricotDeep: '#d69a6b',
    cream: '#393326',
    canvas: '#211f1b',
    surface: '#292620',
    ink: '#efe6d4',
    inkSoft: '#b6a892',
    hairline: '#3a352c',
  },
} as const;

export default {
  light: {
    ...palette.light,
    text: palette.light.ink,
    background: palette.light.canvas,
    tint: palette.light.mintDeep,
    tabIconDefault: palette.light.inkSoft,
    tabIconSelected: palette.light.mintDeep,
  },
  dark: {
    ...palette.dark,
    text: palette.dark.ink,
    background: palette.dark.canvas,
    tint: palette.dark.mintDeep,
    tabIconDefault: palette.dark.inkSoft,
    tabIconSelected: palette.dark.mintDeep,
  },
};
