import { describe, expect, it } from 'vitest';
import {
  CycleConfigError,
  createDefaultCycleConfig,
  parseIsoDate,
  validateCycleConfig,
  type CycleConfig,
} from '../src/index';

const validConfig: CycleConfig = { anchorDate: '2026-01-01', cycleLength: 28, periodLength: 5 };

describe('parseIsoDate', () => {
  it.each([
    ['2026-01-01', Date.UTC(2026, 0, 1)],
    ['2024-02-29', Date.UTC(2024, 1, 29)], // leap day
    ['1999-12-31', Date.UTC(1999, 11, 31)],
  ])('parses valid date %s', (input, expected) => {
    expect(parseIsoDate(input)).toBe(expected);
  });

  it.each([
    ['not-a-date'],
    ['2026-1-1'], // missing zero padding
    ['2026-01-01T00:00:00Z'], // datetime, not date
    ['2026-02-30'], // day does not exist
    ['2025-02-29'], // not a leap year
    ['2026-13-01'], // month out of range
    ['2026-00-10'], // month zero
    [''],
  ])('rejects %s', (input) => {
    expect(parseIsoDate(input)).toBeNull();
  });
});

describe('validateCycleConfig', () => {
  it('accepts a valid config', () => {
    expect(() => validateCycleConfig(validConfig)).not.toThrow();
  });

  it.each([
    [{ ...validConfig, anchorDate: 'garbage' }, 'anchorDate'],
    [{ ...validConfig, anchorDate: '2026-02-30' }, 'anchorDate'],
    [{ ...validConfig, cycleLength: 20 }, 'cycleLength'],
    [{ ...validConfig, cycleLength: 41 }, 'cycleLength'],
    [{ ...validConfig, cycleLength: 27.5 }, 'cycleLength'],
    [{ ...validConfig, cycleLength: Number.NaN }, 'cycleLength'],
    [{ ...validConfig, periodLength: 1 }, 'periodLength'],
    [{ ...validConfig, periodLength: 9 }, 'periodLength'],
    [{ ...validConfig, periodLength: 4.5 }, 'periodLength'],
  ] as const)('throws a typed error for %o', (config, field) => {
    try {
      validateCycleConfig(config);
      expect.unreachable('expected validateCycleConfig to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(CycleConfigError);
      expect((error as CycleConfigError).field).toBe(field);
    }
  });

  it('accepts the boundary values 21/40 and 2/8', () => {
    for (const cycleLength of [21, 40]) {
      for (const periodLength of [2, 8]) {
        expect(() =>
          validateCycleConfig({ anchorDate: '2026-01-01', cycleLength, periodLength }),
        ).not.toThrow();
      }
    }
  });
});

describe('createDefaultCycleConfig', () => {
  it('builds a 28/5 config from an anchor date', () => {
    expect(createDefaultCycleConfig('2026-03-10')).toEqual({
      anchorDate: '2026-03-10',
      cycleLength: 28,
      periodLength: 5,
    });
  });

  it('rejects an invalid anchor date', () => {
    expect(() => createDefaultCycleConfig('bogus')).toThrow(CycleConfigError);
  });
});
