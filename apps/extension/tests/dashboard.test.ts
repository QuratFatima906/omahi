import { describe, expect, it } from 'vitest';
import type { CycleConfig } from '@omahi/core';
import { getDashboardModel } from '../lib/dashboard';

const config: CycleConfig = { anchorDate: '2026-06-20', cycleLength: 28, periodLength: 5 };

/** Local-noon Date — stable calendar day in any test timezone. */
function day(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 12);
}

describe('getDashboardModel', () => {
  it('renders menstruation day 2 with the day-2 variant', () => {
    const model = getDashboardModel(config, day('2026-06-21'));
    expect(model.phase).toBe('menstruation');
    expect(model.phaseLabel).toBe('Menstruation');
    expect(model.cycleDay).toBe(2);
    expect(model.hero).toBe('Rest is productive');
    expect(model.work).toBe('Still low-power mode — shortlists, not marathons.');
    expect(model.nextLine).toBe('Follicular begins in 4 days');
  });

  it('renders follicular day 9 with the clamped last variant', () => {
    const model = getDashboardModel(config, day('2026-06-28'));
    expect(model.phase).toBe('follicular');
    expect(model.cycleDay).toBe(9);
    expect(model.hero).toBe('Big-idea energy');
    expect(model.work).toBe('Momentum is real now — block a deep-work morning.');
    expect(model.nextLine).toBe('Ovulation window opens in 4 days');
  });

  it('renders ovulation and luteal days', () => {
    const ovulation = getDashboardModel(config, day('2026-07-03'));
    expect(ovulation.phase).toBe('ovulation');
    expect(ovulation.hero).toBe('Your spotlight week');
    expect(ovulation.nextLine).toBe('Luteal begins in 2 days');

    const luteal = getDashboardModel(config, day('2026-07-10'));
    expect(luteal.phase).toBe('luteal');
    expect(luteal.cycleDay).toBe(21);
    expect(luteal.hero).toBe('Cozy focus');
    expect(luteal.rest).toBe('Start declining the late things.');
    expect(luteal.nextLine).toBe('Next period predicted in 8 days');
  });

  it('builds segments that partition the cycle, filling only the current phase', () => {
    const model = getDashboardModel(config, day('2026-06-28')); // follicular day 4 of 7
    expect(model.segments.map((s) => [s.phase, s.length])).toEqual([
      ['menstruation', 5],
      ['follicular', 7],
      ['ovulation', 3],
      ['luteal', 13],
    ]);
    const fills = model.segments.map((s) => s.fillRatio);
    expect(fills).toEqual([null, 4 / 7, null, null]);
  });

  it('omits an empty follicular segment', () => {
    const shortCycle: CycleConfig = { anchorDate: '2026-06-20', cycleLength: 21, periodLength: 8 };
    const model = getDashboardModel(shortCycle, day('2026-06-21'));
    expect(model.segments.map((s) => s.phase)).toEqual(['menstruation', 'ovulation', 'luteal']);
  });
});
