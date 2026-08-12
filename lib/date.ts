/** 캘린더/기록 화면에서 쓰는 날짜 유틸. 항상 로컬 타임존 기준 'YYYY-MM-DD' 키를 사용한다. */

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export const WEEKDAY_LABELS_KO = ['일', '월', '화', '수', '목', '금', '토'];

export type CalendarDay = {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
};

/** 항상 6주(42칸) 그리드를 반환한다 — 달마다 주 수가 달라져도 레이아웃이 흔들리지 않도록. */
export function getMonthGrid(year: number, month: number): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return {
      date,
      dateKey: toDateKey(date),
      inCurrentMonth: date.getMonth() === month,
    };
  });
}

export function formatKoreanMonth(year: number, month: number): string {
  return `${year}년 ${month + 1}월`;
}

export function formatKoreanDateLong(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const weekday = WEEKDAY_LABELS_KO[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${weekday})`;
}
