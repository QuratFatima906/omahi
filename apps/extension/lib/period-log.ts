/**
 * Re-anchoring: logged periods correct predictions without ever mutating the
 * onboarding config. The effective anchor is the latest known period start —
 * the newest log entry or, with no log, the original config anchor — so
 * undoing a log entry restores the previous prediction for free.
 */

import type { CycleConfig } from '@omahi/core';
import type { OmahiState } from './storage';

/** The latest known period start, or null before onboarding. */
export function effectiveAnchorDate(state: OmahiState): string | null {
  if (state.cycleConfig === null) return null;
  return state.periodLog.reduce(
    (latest, entry) => (entry.start > latest ? entry.start : latest),
    state.cycleConfig.anchorDate,
  );
}

/** The config every prediction surface should use: config re-anchored to the latest log. */
export function effectiveCycleConfig(state: OmahiState): CycleConfig | null {
  const anchorDate = effectiveAnchorDate(state);
  return state.cycleConfig === null || anchorDate === null
    ? null
    : { ...state.cycleConfig, anchorDate };
}
