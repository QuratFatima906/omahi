import { describe, expect, it } from 'vitest';
import type { CycleConfig } from '@omahi/core';
import { formatClock, formatDateLine, getGreeting, getNewTabModel } from '../lib/newtab';

// Phase ranges for this config: menstruation 1–5, follicular 6–12,
// ovulation 13–15, luteal 16–28.
const config: CycleConfig = { anchorDate: '2026-06-20', cycleLength: 28, periodLength: 5 };

function at(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 9);
}

describe('getNewTabModel', () => {
  it.each([
    ['2026-06-21', 'menstruation', 2, 'Slow week', 'Rest counts as progress today'],
    ['2026-06-28', 'follicular', 9, 'Fresh start', 'Energy is climbing this week'],
    ['2026-07-03', 'ovulation', 14, 'Peak week', 'Peak energy · your best week'],
    ['2026-07-16', 'luteal', 27, 'Focus week', 'Period expected in ~2 days'],
  ])('%s → %s day %i titled "%s"', (iso, phase, cycleDay, title, statusLine) => {
    const model = getNewTabModel(config, at(iso));
    expect(model).toMatchObject({ phase, cycleDay, cycleLength: 28, title, statusLine });
    expect(model.subtitle).not.toBe('');
    expect(model.tip).not.toBe('');
  });

  // Privacy contract: the resting card renders only title/subtitle/tip, so
  // none of them may contain cycle vocabulary or day counts. `statusLine` is
  // exempt — it renders exclusively inside the tap-to-reveal detail chip.
  it.each(['2026-06-21', '2026-06-28', '2026-07-03', '2026-07-16'])(
    'always-visible copy on %s stays neutral',
    (iso) => {
      const identifying = /period|cycle|ovulat|menstru|luteal|follicular|day \d/i;
      const model = getNewTabModel(config, at(iso));
      expect(model.title).not.toMatch(identifying);
      expect(model.subtitle).not.toMatch(identifying);
      expect(model.tip).not.toMatch(identifying);
    },
  );

  it('fills the ring proportionally to the cycle day', () => {
    expect(getNewTabModel(config, at('2026-06-28')).ringFraction).toBeCloseTo(9 / 28);
    expect(getNewTabModel(config, at('2026-07-17')).ringFraction).toBe(1);
  });

  it('gates the luteal countdown to the final week', () => {
    // Day 22 → 7 days out: countdown. Day 21 → 8 days out: energy line.
    expect(getNewTabModel(config, at('2026-07-11')).statusLine).toBe('Period expected in ~7 days');
    expect(getNewTabModel(config, at('2026-07-10')).statusLine).toBe(
      'Steady energy — good week to finish things',
    );
  });

  it('uses the singular on the last cycle day', () => {
    expect(getNewTabModel(config, at('2026-07-17')).statusLine).toBe('Period expected in ~1 day');
  });
});

describe('getGreeting', () => {
  it.each([
    [4, 'Good evening'],
    [5, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [16, 'Good afternoon'],
    [17, 'Good evening'],
  ])('%i:00 → %s', (hour, greeting) => {
    expect(getGreeting(new Date(2026, 6, 10, hour, 0))).toBe(greeting);
  });
});

describe('clock formatting', () => {
  it('drops the day period in 12-hour locales', () => {
    expect(formatClock(new Date(2026, 6, 10, 9, 41), 'en-US')).toBe('9:41');
    expect(formatClock(new Date(2026, 6, 10, 14, 15), 'en-US')).toBe('2:15');
  });

  it('leaves 24-hour locales untouched', () => {
    expect(formatClock(new Date(2026, 6, 10, 14, 15), 'de-DE')).toBe('14:15');
  });

  it('formats the date line as weekday, month day', () => {
    expect(formatDateLine(new Date(2026, 6, 10), 'en-US')).toBe('Friday, July 10');
  });
});
