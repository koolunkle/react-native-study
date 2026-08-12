/**
 * PRD.md 7절 폰트 지정: 배민 한나체 Pro(제목) + 온글잎 박다현체(본문) + Pretendard(숫자/통계).
 * 세 가지 모두 assets/fonts/*.ttf로 번들되어 app/_layout.tsx의 useFonts에 등록돼 있다.
 */
export const Fonts = {
  title: 'BMHANNAPro',
  body: 'OngleipParkDahyeon',
  num: 'Pretendard',
} as const;
