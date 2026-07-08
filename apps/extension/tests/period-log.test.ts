import { describe, expect, it } from 'vitest';
import { effectiveAnchorDate, effectiveCycleConfig } from '../lib/period-log';
import { createEmptyState, type OmahiState } from '../lib/storage';

const config = { anchorDate: '2026-06-20', cycleLength: 28, periodLength: 5 };

function stateWith(log: string[]): OmahiState {
  return {
    ...createEmptyState(),
    cycleConfig: config,
    periodLog: log.map((start) => ({ start })),
  };
}

describe('effectiveAnchorDate', () => {
  it('is null before onboarding', () => {
    expect(effectiveAnchorDate(createEmptyState())).toBeNull();
  });

  it('falls back to the config anchor with an empty log', () => {
    expect(effectiveAnchorDate(stateWith([]))).toBe('2026-06-20');
  });

  it('uses the latest logged start', () => {
    expect(effectiveAnchorDate(stateWith(['2026-07-18']))).toBe('2026-07-18');
    expect(effectiveAnchorDate(stateWith(['2026-07-18', '2026-08-15']))).toBe('2026-08-15');
  });

  it('is order-independent: a backfilled older entry never wins', () => {
    expect(effectiveAnchorDate(stateWith(['2026-08-15', '2026-07-18']))).toBe('2026-08-15');
  });

  it('keeps the config anchor when all logged entries are older', () => {
    expect(effectiveAnchorDate(stateWith(['2026-05-23']))).toBe('2026-06-20');
  });
});

describe('effectiveCycleConfig', () => {
  it('is null before onboarding', () => {
    expect(effectiveCycleConfig(createEmptyState())).toBeNull();
  });

  it('re-anchors the config without touching other fields', () => {
    expect(effectiveCycleConfig(stateWith(['2026-07-18']))).toEqual({
      ...config,
      anchorDate: '2026-07-18',
    });
  });

  it('returns the config unchanged with an empty log', () => {
    expect(effectiveCycleConfig(stateWith([]))).toEqual(config);
  });
});
