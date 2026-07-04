import { describe, expect, it } from 'vitest';
import {
  formatIsoDate,
  formatLocalIso,
  getMonthGrid,
  isoMonthOrdinal,
  isoYearMonth,
  monthOrdinal,
  shiftMonth,
} from '../lib/month-grid';

describe('formatIsoDate / formatLocalIso', () => {
  it('pads month and day to two digits', () => {
    expect(formatIsoDate(2026, 7, 4)).toBe('2026-07-04');
    expect(formatIsoDate(2026, 11, 30)).toBe('2026-11-30');
  });

  it('formats a Date by its local calendar fields', () => {
    // Local-noon construction keeps the calendar day stable in any timezone.
    expect(formatLocalIso(new Date(2026, 0, 9, 12))).toBe('2026-01-09');
    expect(formatLocalIso(new Date(2026, 11, 31, 12))).toBe('2026-12-31');
  });
});

describe('monthOrdinal / isoMonthOrdinal', () => {
  it('orders months across year boundaries', () => {
    expect(monthOrdinal(2026, 1)).toBe(monthOrdinal(2025, 12) + 1);
    expect(monthOrdinal(2026, 7)).toBeGreaterThan(monthOrdinal(2026, 6));
  });

  it('reads the month ordinal from an ISO date string', () => {
    expect(isoMonthOrdinal('2026-07-04')).toBe(monthOrdinal(2026, 7));
    expect(isoMonthOrdinal('1999-12-01')).toBe(monthOrdinal(1999, 12));
  });

  it('splits an ISO date string into year and month', () => {
    expect(isoYearMonth('2026-07-04')).toEqual({ year: 2026, month: 7 });
    expect(isoYearMonth('1999-12-31')).toEqual({ year: 1999, month: 12 });
  });
});

describe('shiftMonth', () => {
  it.each([
    [2026, 7, -1, { year: 2026, month: 6 }],
    [2026, 7, 1, { year: 2026, month: 8 }],
    [2026, 1, -1, { year: 2025, month: 12 }],
    [2025, 12, 1, { year: 2026, month: 1 }],
    [2026, 3, -15, { year: 2024, month: 12 }],
    [2026, 3, 22, { year: 2028, month: 1 }],
    [2026, 3, 0, { year: 2026, month: 3 }],
  ])('%i-%i shifted by %i', (year, month, delta, expected) => {
    expect(shiftMonth(year, month, delta)).toEqual(expected);
  });
});

describe('getMonthGrid', () => {
  it('lays out June 2026 (starts Monday, 30 days)', () => {
    const grid = getMonthGrid(2026, 6);
    expect(grid.label).toBe('June 2026');
    expect(grid.leadingBlanks).toBe(1);
    expect(grid.cells).toHaveLength(30);
    expect(grid.cells[0]).toEqual({ day: 1, iso: '2026-06-01' });
    expect(grid.cells[29]).toEqual({ day: 30, iso: '2026-06-30' });
  });

  it('lays out a Sunday-starting month with no leading blanks', () => {
    const grid = getMonthGrid(2026, 2); // Feb 2026 starts on a Sunday
    expect(grid.leadingBlanks).toBe(0);
    expect(grid.cells).toHaveLength(28);
  });

  it('handles leap February', () => {
    const grid = getMonthGrid(2028, 2);
    expect(grid.cells).toHaveLength(29);
    expect(grid.cells[28]!.iso).toBe('2028-02-29');
  });

  it('handles December (year boundary month)', () => {
    const grid = getMonthGrid(2026, 12);
    expect(grid.label).toBe('December 2026');
    expect(grid.cells).toHaveLength(31);
    expect(grid.cells[30]!.iso).toBe('2026-12-31');
  });
});
