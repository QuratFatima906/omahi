import { describe, expect, it } from 'vitest';
import { MAX_CYCLE_LENGTH, MIN_CYCLE_LENGTH } from '@omahi/core';
import {
  ANCHOR_DATE_ERROR_MESSAGES,
  clampCycleLength,
  validateAnchorDate,
} from '../lib/onboarding-form';

const today = '2026-07-04';

describe('validateAnchorDate', () => {
  it('rejects a missing selection', () => {
    expect(validateAnchorDate(null, today)).toBe('missing');
  });

  it('rejects a future date', () => {
    expect(validateAnchorDate('2026-07-05', today)).toBe('future');
    expect(validateAnchorDate('2027-01-01', today)).toBe('future');
  });

  it('accepts today and past dates', () => {
    expect(validateAnchorDate(today, today)).toBeNull();
    expect(validateAnchorDate('2026-06-24', today)).toBeNull();
    expect(validateAnchorDate('2025-12-31', today)).toBeNull();
  });

  it('has an Omahi-voice message for every error kind', () => {
    expect(ANCHOR_DATE_ERROR_MESSAGES.missing).toContain('Not sure');
    expect(ANCHOR_DATE_ERROR_MESSAGES.future).toContain('today or earlier');
  });
});

describe('clampCycleLength', () => {
  it.each([
    [28, 28],
    [MIN_CYCLE_LENGTH - 5, MIN_CYCLE_LENGTH],
    [MAX_CYCLE_LENGTH + 5, MAX_CYCLE_LENGTH],
    [27.6, 28],
    [MIN_CYCLE_LENGTH, MIN_CYCLE_LENGTH],
    [MAX_CYCLE_LENGTH, MAX_CYCLE_LENGTH],
  ])('clamps %s to %s', (input, expected) => {
    expect(clampCycleLength(input)).toBe(expected);
  });
});
