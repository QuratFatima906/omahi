import { describe, expect, it } from 'vitest';
import {
  CycleConfigError,
  getForecast,
  getPhase,
  PHASES,
  type CycleConfig,
  type Phase,
} from '../src/index';

/** Local-noon Date for a calendar date — exercises time-of-day/timezone normalization. */
function localDate(iso: string, hour = 12): Date {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
  return new Date(year, month - 1, day, hour);
}

const default28: CycleConfig = { anchorDate: '2026-01-01', cycleLength: 28, periodLength: 5 };

describe('getPhase — default 28/5 cycle, every phase boundary', () => {
  // 28/5 model: menstruation 1–5, follicular 6–12, ovulation 13–15 (day 14 ±1), luteal 16–28.
  it.each<[string, Phase, number, number, Phase, number]>([
    // date, phase, cycleDay, dayOfPhase, nextPhase, daysUntilNextPhase
    ['2026-01-01', 'menstruation', 1, 1, 'follicular', 5],
    ['2026-01-05', 'menstruation', 5, 5, 'follicular', 1],
    ['2026-01-06', 'follicular', 6, 1, 'ovulation', 7],
    ['2026-01-12', 'follicular', 12, 7, 'ovulation', 1],
    ['2026-01-13', 'ovulation', 13, 1, 'luteal', 3],
    ['2026-01-15', 'ovulation', 15, 3, 'luteal', 1],
    ['2026-01-16', 'luteal', 16, 1, 'menstruation', 13],
    ['2026-01-28', 'luteal', 28, 13, 'menstruation', 1],
    ['2026-01-29', 'menstruation', 1, 1, 'follicular', 5], // next cycle begins
  ])('%s → %s (cycleDay %i)', (date, phase, cycleDay, dayOfPhase, nextPhase, daysUntil) => {
    expect(getPhase(default28, localDate(date))).toEqual({
      phase,
      cycleDay,
      dayOfPhase,
      nextPhase,
      daysUntilNextPhase: daysUntil,
    });
  });

  it('ignores time of day', () => {
    for (const hour of [0, 12, 23]) {
      expect(getPhase(default28, localDate('2026-01-13', hour)).cycleDay).toBe(13);
    }
  });
});

describe('getPhase — edge cases', () => {
  it('anchor date is today → cycle day 1, menstruation', () => {
    const info = getPhase(default28, localDate('2026-01-01'));
    expect(info).toMatchObject({ phase: 'menstruation', cycleDay: 1, dayOfPhase: 1 });
  });

  it('wraps forward across many cycles', () => {
    // 2026-03-01 is 59 days after anchor; 59 % 28 = 3 → cycle day 4.
    expect(getPhase(default28, localDate('2026-03-01'))).toMatchObject({
      phase: 'menstruation',
      cycleDay: 4,
    });
    // 10 full cycles later, same cycle day as the anchor.
    expect(getPhase(default28, localDate('2026-10-08'))).toMatchObject({ cycleDay: 1 });
  });

  it('wraps backward for dates before the anchor', () => {
    expect(getPhase(default28, localDate('2025-12-31'))).toMatchObject({
      phase: 'luteal',
      cycleDay: 28,
    });
    // A full cycle before the anchor is again day 1.
    expect(getPhase(default28, localDate('2025-12-04'))).toMatchObject({ cycleDay: 1 });
  });

  it('throws a typed error for an invalid config', () => {
    const bad = { ...default28, cycleLength: 99 };
    expect(() => getPhase(bad, localDate('2026-01-01'))).toThrow(CycleConfigError);
  });
});

describe('getPhase — overlap clamping (short cycle + long period)', () => {
  // 21/8: ovulation day 7 (±1 → 6–8) collides with the period (1–8), so the
  // window is pushed to day 9 and the follicular phase is empty.
  const clamped: CycleConfig = { anchorDate: '2026-01-01', cycleLength: 21, periodLength: 8 };

  it('menstruation wins; nextPhase skips the empty follicular phase', () => {
    expect(getPhase(clamped, localDate('2026-01-08'))).toEqual({
      phase: 'menstruation',
      cycleDay: 8,
      dayOfPhase: 8,
      nextPhase: 'ovulation',
      daysUntilNextPhase: 1,
    });
  });

  it('ovulation shrinks to the day after the period ends', () => {
    expect(getPhase(clamped, localDate('2026-01-09'))).toEqual({
      phase: 'ovulation',
      cycleDay: 9,
      dayOfPhase: 1,
      nextPhase: 'luteal',
      daysUntilNextPhase: 1,
    });
    expect(getPhase(clamped, localDate('2026-01-10')).phase).toBe('luteal');
  });
});

describe('phase partition property — cycle lengths 21–40 × period lengths 2–8', () => {
  for (let cycleLength = 21; cycleLength <= 40; cycleLength++) {
    for (let periodLength = 2; periodLength <= 8; periodLength++) {
      it(`cycle ${cycleLength} / period ${periodLength} partitions with no gaps or overlaps`, () => {
        const config: CycleConfig = { anchorDate: '2026-01-01', cycleLength, periodLength };
        const days = getForecast(config, localDate('2026-01-01'), cycleLength);

        // Every day maps to exactly one phase, cycle days run 1..cycleLength in order.
        expect(days.map((d) => d.cycleDay)).toEqual(
          Array.from({ length: cycleLength }, (_, i) => i + 1),
        );

        // Phases appear as contiguous blocks in canonical order (follicular may be absent).
        const blocks: Phase[] = [];
        for (const day of days) {
          if (blocks[blocks.length - 1] !== day.phase) blocks.push(day.phase);
        }
        const expectedOrder = PHASES.filter((p) => blocks.includes(p));
        expect(blocks).toEqual(expectedOrder);
        expect(blocks[0]).toBe('menstruation');
        expect(blocks).toContain('ovulation');
        expect(blocks[blocks.length - 1]).toBe('luteal');

        // Menstruation is exactly the period, and dayOfPhase counts up within each block.
        expect(days.filter((d) => d.phase === 'menstruation')).toHaveLength(periodLength);
        let expectedDayOfPhase = 0;
        let previousPhase: Phase | undefined;
        for (const day of days) {
          expectedDayOfPhase = day.phase === previousPhase ? expectedDayOfPhase + 1 : 1;
          expect(day.dayOfPhase).toBe(expectedDayOfPhase);
          expect(day.daysUntilNextPhase).toBeGreaterThanOrEqual(1);
          previousPhase = day.phase;
        }

        // daysUntilNextPhase counts down to each block boundary.
        for (let i = 0; i < days.length - 1; i++) {
          const day = days[i]!;
          const next = days[i + 1]!;
          if (day.phase === next.phase) {
            expect(next.daysUntilNextPhase).toBe(day.daysUntilNextPhase - 1);
          } else {
            expect(day.daysUntilNextPhase).toBe(1);
            expect(day.nextPhase).toBe(next.phase);
          }
        }
        // Last day of the cycle rolls into menstruation of the next cycle.
        expect(days[days.length - 1]!.daysUntilNextPhase).toBe(1);
        expect(days[days.length - 1]!.nextPhase).toBe('menstruation');
      });
    }
  }
});

describe('getForecast', () => {
  it('returns consecutive calendar dates matching getPhase', () => {
    const forecast = getForecast(default28, localDate('2026-01-27'), 4);
    expect(forecast.map((d) => d.date)).toEqual([
      '2026-01-27',
      '2026-01-28',
      '2026-01-29', // crosses both the cycle and month boundary
      '2026-01-30',
    ]);
    expect(forecast.map((d) => d.phase)).toEqual([
      'luteal',
      'luteal',
      'menstruation',
      'menstruation',
    ]);
    for (const day of forecast) {
      expect(day).toEqual({ date: day.date, ...getPhase(default28, localDate(day.date)) });
    }
  });

  it('starts before the anchor without gaps', () => {
    const forecast = getForecast(default28, localDate('2025-12-30'), 3);
    expect(forecast.map((d) => d.cycleDay)).toEqual([27, 28, 1]);
  });

  it.each([[0], [-1], [2.5], [Number.NaN]])('throws RangeError for days = %s', (days) => {
    expect(() => getForecast(default28, localDate('2026-01-01'), days)).toThrow(RangeError);
  });

  it('throws a typed error for an invalid config', () => {
    const bad = { ...default28, periodLength: 0 };
    expect(() => getForecast(bad, localDate('2026-01-01'), 7)).toThrow(CycleConfigError);
  });
});
