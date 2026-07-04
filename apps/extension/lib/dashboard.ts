/**
 * Pure view-model for the popup dashboard: everything the component renders,
 * derived from config + injected date so it unit-tests without React.
 */

import {
  getDailySuggestion,
  getNextPhaseLine,
  getPhaseLengths,
  PHASE_LABELS,
  PHASES,
  type CycleConfig,
  type DailySuggestion,
  type Phase,
} from '@omahi/core';

export interface PhaseSegment {
  phase: Phase;
  /** Days this phase spans — the segment's flex weight. */
  length: number;
  /** Progress through the phase (0–1] for the current phase, null for the rest. */
  fillRatio: number | null;
}

export interface DashboardModel extends DailySuggestion {
  phaseLabel: string;
  nextLine: string;
  segments: PhaseSegment[];
}

export function getDashboardModel(config: CycleConfig, today: Date): DashboardModel {
  const suggestion = getDailySuggestion(config, today);
  const lengths = getPhaseLengths(config);
  return {
    ...suggestion,
    phaseLabel: PHASE_LABELS[suggestion.phase],
    nextLine: getNextPhaseLine(suggestion),
    segments: PHASES.filter((phase) => lengths[phase] > 0).map((phase) => ({
      phase,
      length: lengths[phase],
      fillRatio: phase === suggestion.phase ? suggestion.dayOfPhase / lengths[phase] : null,
    })),
  };
}
