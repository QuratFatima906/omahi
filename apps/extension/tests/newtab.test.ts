import { describe, expect, it } from 'vitest';
import type { CycleConfig } from '@omahi/core';
import { getGreeting, getNewTabModel, getNextPeriodDate } from '../lib/newtab';

const config: CycleConfig = { anchorDate: '2026-06-20', cycleLength: 28, periodLength: 5 };

function at(iso: string, hour: number): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!, hour);
}

describe('getGreeting', () => {
  it.each([
    [0, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [16, 'Good afternoon'],
    [17, 'Good evening'],
    [23, 'Good evening'],
  ])('hour %i → %s', (hour, expected) => {
    expect(getGreeting(hour)).toBe(expected);
  });
});

describe('getNextPeriodDate', () => {
  it('finds the next cycle start after today', () => {
    // Anchor Jun 20, cycle 28 → next period Jul 18.
    expect(getNextPeriodDate(config, at('2026-06-28', 9))).toBe('2026-07-18');
    expect(getNextPeriodDate(config, at('2026-07-17', 9))).toBe('2026-07-18');
  });

  it('skips today when today is already cycle day 1', () => {
    expect(getNextPeriodDate(config, at('2026-07-18', 9))).toBe('2026-08-15');
  });
});

describe('getNewTabModel', () => {
  it('composes headline, date line, and next period on top of the dashboard model', () => {
    const model = getNewTabModel(config, at('2026-06-28', 9)); // follicular day 9
    expect(model.phase).toBe('follicular');
    expect(model.headline).toBe('Good morning — big-idea energy.');
    expect(model.dateLine).toBe('Sunday, June 28');
    expect(model.nextPeriodDate).toBe('2026-07-18');
  });

  it('greets by the injected hour', () => {
    expect(getNewTabModel(config, at('2026-06-28', 20)).headline).toMatch(/^Good evening — /);
  });
});
