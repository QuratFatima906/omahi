/**
 * Pure calendar math for the onboarding date picker (and later the phase
 * calendar, Chunk 6). Dates are plain calendar days — `{ year, month, day }`
 * triples and `YYYY-MM-DD` strings — with no timezone handling beyond
 * reading a `Date`'s local components once at the component layer.
 */

export interface MonthCell {
  day: number;
  iso: string;
}

export interface MonthGrid {
  year: number;
  /** 1-based month. */
  month: number;
  /** e.g. "June 2026". */
  label: string;
  /** Empty cells before day 1 in a Sunday-first week row. */
  leadingBlanks: number;
  cells: MonthCell[];
}

/**
 * Sunday-first weekday headers. `getMonthGrid().leadingBlanks` assumes this
 * order — a week-start change must update both together.
 */
export const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** A `Date`'s local calendar day as `YYYY-MM-DD` (what the user sees as "today"). */
export function formatLocalIso(date: Date): string {
  return formatIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** Comparable month ordinal: later months compare greater. */
export function monthOrdinal(year: number, month: number): number {
  return year * 12 + (month - 1);
}

/** The year/month fields of a `YYYY-MM-DD` string. */
export function isoYearMonth(iso: string): { year: number; month: number } {
  return { year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) };
}

/** The month ordinal of a `YYYY-MM-DD` string. */
export function isoMonthOrdinal(iso: string): number {
  const { year, month } = isoYearMonth(iso);
  return monthOrdinal(year, month);
}

/** Shift a year/month by `delta` months, carrying across year boundaries. */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const ordinal = monthOrdinal(year, month) + delta;
  return { year: Math.floor(ordinal / 12), month: (((ordinal % 12) + 12) % 12) + 1 };
}

export function getMonthGrid(year: number, month: number): MonthGrid {
  // Date.UTC avoids DST edges; only calendar fields are read back.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const cells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    iso: formatIsoDate(year, month, i + 1),
  }));
  return { year, month, label: `${MONTH_NAMES[month - 1]} ${year}`, leadingBlanks, cells };
}
