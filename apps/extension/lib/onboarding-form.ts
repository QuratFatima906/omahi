/**
 * Pure validation for the onboarding form. Cycle and period lengths are
 * constrained by the controls themselves (stepper/slider/pills), so the only
 * field that can go wrong is the anchor date.
 */

import { MAX_CYCLE_LENGTH, MIN_CYCLE_LENGTH } from '@omahi/core';

export type AnchorDateError = 'missing' | 'future';

/** Omahi-voice messages for each anchor-date error. */
export const ANCHOR_DATE_ERROR_MESSAGES: Record<AnchorDateError, string> = {
  missing: 'Pick the day your last period started — or tap "Not sure".',
  future: "That day hasn't happened yet — pick today or earlier.",
};

/**
 * Validate the selected anchor date against today (both `YYYY-MM-DD`, which
 * compare correctly as strings). Returns the error kind, or `null` if valid.
 */
export function validateAnchorDate(
  selected: string | null,
  todayIso: string,
): AnchorDateError | null {
  if (selected === null) return 'missing';
  if (selected > todayIso) return 'future';
  return null;
}

/** Clamp a cycle-length value into the supported 21–40 range. */
export function clampCycleLength(value: number): number {
  return Math.min(MAX_CYCLE_LENGTH, Math.max(MIN_CYCLE_LENGTH, Math.round(value)));
}
