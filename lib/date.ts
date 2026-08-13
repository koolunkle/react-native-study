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

/** 통계 화면(PRD 6-5)의 기간 선택. */
export type StatsPeriod = 'week' | 'month' | 'all';

export type DateRange = { start: string; end: string };

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 일요일 시작 주 (getMonthGrid와 동일한 일=0 규칙). */
export function getWeekRange(dateKey: string): DateRange {
  const date = parseDateKey(dateKey);
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toDateKey(start), end: toDateKey(end) };
}

export function getMonthRange(year: number, month: number): DateRange {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start: toDateKey(start), end: toDateKey(end) };
}

/**
 * 기간 선택에 맞는 날짜 범위를 계산. 'all'은 하한이 없으므로 start를 null로 반환하고,
 * 호출부가 getAllTimeStart(db) 등으로 구한 실제 하한을 채워 넣는다.
 */
export function getPeriodRange(
  period: StatsPeriod,
  referenceDateKey: string,
  allTimeStart: string | null
): { start: string | null; end: string } {
  if (period === 'week') return getWeekRange(referenceDateKey);
  if (period === 'month') {
    const date = parseDateKey(referenceDateKey);
    return getMonthRange(date.getFullYear(), date.getMonth());
  }
  return { start: allTimeStart, end: referenceDateKey };
}
