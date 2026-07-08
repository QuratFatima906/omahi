import { describe, expect, it } from 'vitest';
import type { CycleConfig } from '@omahi/core';
import { getCalendarMonth } from '../lib/calendar';

// Anchor on July 1 makes cycle days equal July dates: period Jul 1–5,
// follicular 6–12, ovulation 13–15, luteal 16–28, next period from Jul 29.
const config: CycleConfig = { anchorDate: '2026-07-01', cycleLength: 28, periodLength: 5 };

describe('getCalendarMonth', () => {
  const model = getCalendarMonth(config, 2026, 7, '2026-07-02');

  it('labels the month and pads with adjacent-month days', () => {
    expect(model.label).toBe('July 2026');
    // July 1 2026 is a Wednesday → Sun/Mon/Tue trail from June (28–30).
    expect(model.prevMonthTrail).toEqual([28, 29, 30]);
    // July 31 is a Friday → Saturday lead from August.
    expect(model.nextMonthLead).toEqual([1]);
    expect(model.days).toHaveLength(31);
  });

  it('phases every day of the month', () => {
    const phaseOf = (day: number) => model.days[day - 1]!.phase;
    expect(phaseOf(1)).toBe('menstruation');
    expect(phaseOf(5)).toBe('menstruation');
    expect(phaseOf(6)).toBe('follicular');
    expect(phaseOf(12)).toBe('follicular');
    expect(phaseOf(13)).toBe('ovulation');
    expect(phaseOf(15)).toBe('ovulation');
    expect(phaseOf(16)).toBe('luteal');
    expect(phaseOf(28)).toBe('luteal');
    expect(phaseOf(29)).toBe('menstruation');
    expect(phaseOf(31)).toBe('menstruation');
  });

  it('marks only the anchor cycle period as recorded, later ones as predicted', () => {
    expect(model.days[0]!.isPredictedPeriod).toBe(false); // Jul 1, anchor cycle
    expect(model.days[4]!.isPredictedPeriod).toBe(false); // Jul 5, anchor cycle
    expect(model.days[28]!.isPredictedPeriod).toBe(true); // Jul 29, next cycle
    expect(model.days[30]!.isPredictedPeriod).toBe(true); // Jul 31
    expect(model.days[15]!.isPredictedPeriod).toBe(false); // luteal day is never "predicted period"
  });

  it('marks today exactly once', () => {
    const todays = model.days.filter((d) => d.isToday);
    expect(todays.map((d) => d.iso)).toEqual(['2026-07-02']);
  });

  it('marks past hypothetical cycles as predicted too', () => {
    const june = getCalendarMonth(config, 2026, 6, '2026-07-02');
    // June 3 = 28 days before Jul 1 → menstruation of the previous (unlogged) cycle.
    expect(june.days[2]!.phase).toBe('menstruation');
    expect(june.days[2]!.isPredictedPeriod).toBe(true);
    expect(june.days.some((d) => d.isToday)).toBe(false);
  });

  it('handles a month with no adjacent-month padding rows', () => {
    // February 2026 starts on a Sunday and has exactly 28 days → 0 trail, 0 lead.
    const feb = getCalendarMonth(config, 2026, 2, '2026-07-02');
    expect(feb.prevMonthTrail).toEqual([]);
    expect(feb.nextMonthLead).toEqual([]);
  });
});
