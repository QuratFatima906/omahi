import { describe, expect, it } from 'vitest';
import { CycleConfigError, type CycleConfig } from '../src/cycle-config';
import { getPhase, getPhaseLengths, PHASES, type PhaseInfo } from '../src/phase-engine';
import {
  getDailySuggestion,
  getNextPhaseLine,
  PHASE_LABELS,
  pickTip,
  resolveDayContent,
  SUGGESTIONS_EN,
  type PhaseContent,
} from '../src/suggestions';

const config: CycleConfig = { anchorDate: '2026-06-20', cycleLength: 28, periodLength: 5 };

/** Local-noon Date for a calendar day — stable in any test timezone. */
function day(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 12);
}

describe('SUGGESTIONS_EN completeness', () => {
  it.each(PHASES)('%s has complete, non-empty content', (phase) => {
    const content = SUGGESTIONS_EN[phase];
    expect(content.hero.length).toBeGreaterThan(0);
    for (const field of ['work', 'food', 'move', 'rest'] as const) {
      expect(content.base[field].length).toBeGreaterThan(0);
    }
    expect(content.tips.length).toBeGreaterThanOrEqual(3);
    expect(content.tips.length).toBeLessThanOrEqual(5);
    for (const tip of content.tips) {
      expect(tip.length).toBeGreaterThan(0);
    }
    expect(content.dayVariants.length).toBeGreaterThan(0);
    for (const variant of content.dayVariants) {
      for (const value of Object.values(variant)) {
        expect(value!.length).toBeGreaterThan(0);
      }
    }
  });

  it.each(PHASES)('%s heroes contain no em-dash (they join a greeting with one)', (phase) => {
    const content = SUGGESTIONS_EN[phase];
    expect(content.hero).not.toContain('—');
    for (const variant of content.dayVariants) {
      expect(variant.hero ?? '').not.toContain('—');
    }
  });

  it('has a display label for every phase', () => {
    for (const phase of PHASES) {
      expect(PHASE_LABELS[phase].toLowerCase()).toBe(phase);
    }
  });

  it('makes no medical claims', () => {
    const copy = JSON.stringify(SUGGESTIONS_EN).toLowerCase();
    for (const banned of ['cure', 'treat', 'diagnos', 'medic', 'guarantee', 'hormone level']) {
      expect(copy).not.toContain(banned);
    }
  });
});

describe('resolveDayContent', () => {
  const content: PhaseContent = {
    hero: 'Base hero',
    base: { work: 'base work', food: 'base food', move: 'base move', rest: 'base rest' },
    dayVariants: [
      { hero: 'Day 1 hero', work: 'day 1 work' },
      { food: 'day 2 food', move: 'day 2 move', rest: 'day 2 rest' },
    ],
    tips: ['a', 'b', 'c'],
  };

  it('layers the day variant over the base', () => {
    expect(resolveDayContent(content, 1)).toEqual({
      hero: 'Day 1 hero',
      work: 'day 1 work',
      food: 'base food',
      move: 'base move',
      rest: 'base rest',
    });
    expect(resolveDayContent(content, 2)).toEqual({
      hero: 'Base hero',
      work: 'base work',
      food: 'day 2 food',
      move: 'day 2 move',
      rest: 'day 2 rest',
    });
  });

  it('clamps days past the last authored variant to the last one', () => {
    expect(resolveDayContent(content, 13)).toEqual(resolveDayContent(content, 2));
  });

  it('falls back to base content when no variants are authored', () => {
    const bare = { ...content, dayVariants: [] };
    expect(resolveDayContent(bare, 1)).toEqual({ hero: 'Base hero', ...bare.base });
  });
});

describe('pickTip', () => {
  const tips = ['t0', 't1', 't2', 't3'];

  it('is deterministic for a given anchor and date', () => {
    expect(pickTip(tips, config.anchorDate, day('2026-07-04'))).toBe(
      pickTip(tips, config.anchorDate, day('2026-07-04')),
    );
  });

  it('walks the pool one step per day and covers every tip', () => {
    const seen = new Set<string>();
    for (let i = 0; i < tips.length; i += 1) {
      seen.add(pickTip(tips, config.anchorDate, day(`2026-07-${String(4 + i).padStart(2, '0')}`)));
    }
    expect(seen).toEqual(new Set(tips));
  });

  it('differs by anchor date so users see different sequences', () => {
    const date = day('2026-07-04');
    expect(pickTip(tips, '2026-06-20', date)).not.toBe(pickTip(tips, '2026-06-21', date));
  });

  it('handles pre-1970 dates via the wrapped modulo', () => {
    expect(tips).toContain(pickTip(tips, '1969-01-01', day('1969-06-01')));
  });

  it('rejects an empty pool', () => {
    expect(() => pickTip([], config.anchorDate, day('2026-07-04'))).toThrow(RangeError);
  });

  it('rejects an invalid anchor date', () => {
    expect(() => pickTip(tips, 'nope', day('2026-07-04'))).toThrow(CycleConfigError);
  });
});

describe('getDailySuggestion', () => {
  it('combines phase info, day content, and the daily tip', () => {
    const date = day('2026-06-28'); // cycleDay 9 → follicular for 28/5
    const info = getPhase(config, date);
    const suggestion = getDailySuggestion(config, date);
    expect(info.phase).toBe('follicular');
    expect(suggestion).toEqual({
      ...info,
      ...resolveDayContent(SUGGESTIONS_EN.follicular, info.dayOfPhase),
      tip: pickTip(SUGGESTIONS_EN.follicular.tips, config.anchorDate, date),
    });
  });

  it('produces content for every day of a long and a short cycle', () => {
    for (const cycleLength of [21, 40]) {
      const long = { ...config, cycleLength };
      for (let offset = 0; offset < cycleLength; offset += 1) {
        const date = new Date(2026, 5, 20 + offset, 12);
        const suggestion = getDailySuggestion(long, date);
        for (const field of ['hero', 'work', 'food', 'move', 'rest', 'tip'] as const) {
          expect(suggestion[field].length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('accepts alternate locale data', () => {
    const data = {
      ...SUGGESTIONS_EN,
      follicular: { ...SUGGESTIONS_EN.follicular, hero: 'Custom hero', dayVariants: [] },
    };
    expect(getDailySuggestion(config, day('2026-06-28'), data).hero).toBe('Custom hero');
  });

  it('rejects an invalid config', () => {
    expect(() => getDailySuggestion({ ...config, cycleLength: 5 }, day('2026-07-04'))).toThrow(
      CycleConfigError,
    );
  });
});

describe('getPhaseLengths (segment source for the dashboard)', () => {
  it('partitions the cycle for the default config', () => {
    const lengths = getPhaseLengths(config);
    expect(lengths).toEqual({ menstruation: 5, follicular: 7, ovulation: 3, luteal: 13 });
  });

  it('sums to cycleLength for every supported config', () => {
    for (let cycleLength = 21; cycleLength <= 40; cycleLength += 1) {
      for (const periodLength of [2, 5, 8]) {
        const lengths = getPhaseLengths({ anchorDate: '2026-06-20', cycleLength, periodLength });
        const total = Object.values(lengths).reduce((a, b) => a + b, 0);
        expect(total).toBe(cycleLength);
      }
    }
  });

  it('reports an empty follicular phase as 0 days', () => {
    expect(getPhaseLengths({ anchorDate: '2026-06-20', cycleLength: 21, periodLength: 8 })).toEqual(
      { menstruation: 8, follicular: 0, ovulation: 1, luteal: 12 },
    );
  });

  it('rejects an invalid config', () => {
    expect(() => getPhaseLengths({ ...config, periodLength: 99 })).toThrow(CycleConfigError);
  });
});

describe('getNextPhaseLine', () => {
  const base: Omit<PhaseInfo, 'nextPhase' | 'daysUntilNextPhase'> = {
    phase: 'menstruation',
    cycleDay: 1,
    dayOfPhase: 1,
  };

  it.each([
    ['menstruation', 8, 'Next period predicted in 8 days'],
    ['follicular', 4, 'Follicular begins in 4 days'],
    ['ovulation', 6, 'Ovulation window opens in 6 days'],
    ['luteal', 2, 'Luteal begins in 2 days'],
  ] as const)('announces %s in %i days', (nextPhase, daysUntilNextPhase, expected) => {
    expect(getNextPhaseLine({ ...base, nextPhase, daysUntilNextPhase })).toBe(expected);
  });

  it('uses the singular for one day', () => {
    expect(getNextPhaseLine({ ...base, nextPhase: 'ovulation', daysUntilNextPhase: 1 })).toBe(
      'Ovulation window opens in 1 day',
    );
  });
});
