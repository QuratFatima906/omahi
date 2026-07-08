import { describe, expect, it } from 'vitest';
import type { CycleConfig } from '@omahi/core';
import { getNewTabModel } from '../lib/newtab';

// Phase ranges for this config: menstruation 1–5, follicular 6–12,
// ovulation 13–15, luteal 16–28.
const config: CycleConfig = { anchorDate: '2026-06-20', cycleLength: 28, periodLength: 5 };

function at(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 9);
}

describe('getNewTabModel', () => {
  it.each([
    ['2026-06-21', 'menstruation', 2, 15, 'Recharging', 'Rest counts as progress today.'],
    [
      '2026-06-28',
      'follicular',
      9,
      55,
      'Charging up',
      'Energy is climbing — good day to start things.',
    ],
    ['2026-07-03', 'ovulation', 14, 100, 'Full battery', 'Peak energy — this is your best week.'],
    [
      '2026-07-16',
      'luteal',
      27,
      22,
      'Low battery',
      'Take it slow — your period starts in ~2 days.',
    ],
  ])('%s → %s day %i', (iso, phase, cycleDay, batteryPct, batteryLabel, headline) => {
    const model = getNewTabModel(config, at(iso));
    expect(model).toMatchObject({ phase, cycleDay, cycleLength: 28, batteryPct, batteryLabel });
    expect(model.headline).toBe(headline);
    expect(model.tip).not.toBe('');
  });

  it('sweeps the ring proportionally to the cycle day', () => {
    expect(getNewTabModel(config, at('2026-06-28')).ringDeg).toBe(116); // 9/28 × 360
    expect(getNewTabModel(config, at('2026-07-16')).ringDeg).toBe(347); // 27/28 × 360
  });

  it('uses the singular on the last cycle day', () => {
    const model = getNewTabModel(config, at('2026-07-17')); // day 28
    expect(model.headline).toBe('Take it slow — your period starts in ~1 day.');
    expect(model.ringDeg).toBe(360);
  });
});
