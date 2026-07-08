/**
 * Pure view-model for the new-tab page: one glanceable state per phase —
 * cycle-ring progress, a battery-style energy read, one headline, one tip.
 *
 * Copy is per-phase for now (finalized in the new-tab design handoff). If we
 * later author per-day copy, extend `getPhaseCopy` to key on `cycleDay` — the
 * component renders whatever this model returns.
 */

import { getPhase, type CycleConfig, type Phase } from '@omahi/core';

export interface NewTabModel {
  phase: Phase;
  cycleDay: number;
  cycleLength: number;
  /** Ring sweep for the conic-gradient: (cycleDay / cycleLength) × 360, rounded. */
  ringDeg: number;
  /** Battery fill 0–100, a fixed per-phase energy read. */
  batteryPct: number;
  /** "Low battery", "Charging up" … */
  batteryLabel: string;
  headline: string;
  /** Rendered after the "One thing for today:" lead-in. */
  tip: string;
}

interface PhaseCopy {
  batteryPct: number;
  batteryLabel: string;
  headline: (daysToPeriod: number) => string;
  tip: string;
}

// Copy is final per the design handoff: non-prescriptive, permission-framed —
// never verdict language. Keep that register when editing.
const PHASE_COPY: Record<Phase, PhaseCopy> = {
  menstruation: {
    batteryPct: 15,
    batteryLabel: 'Recharging',
    headline: () => 'Rest counts as progress today.',
    tip: 'keep the schedule light — cancel or move one thing if you can.',
  },
  follicular: {
    batteryPct: 55,
    batteryLabel: 'Charging up',
    headline: () => 'Energy is climbing — good day to start things.',
    tip: "open the project you've been putting off — starting feels easier this week.",
  },
  ovulation: {
    batteryPct: 100,
    batteryLabel: 'Full battery',
    headline: () => 'Peak energy — this is your best week.',
    tip: "schedule the hard conversation or big pitch — you'll land it best now.",
  },
  luteal: {
    batteryPct: 22,
    batteryLabel: 'Low battery',
    headline: (daysToPeriod) =>
      `Take it slow — your period starts in ~${daysToPeriod} ${daysToPeriod === 1 ? 'day' : 'days'}.`,
    tip: 'clear the small stuff off your list — deep focus comes back next week.',
  },
};

export function getNewTabModel(config: CycleConfig, today: Date): NewTabModel {
  const info = getPhase(config, today);
  const copy = PHASE_COPY[info.phase];
  // Day after the cycle's last day is the next day 1 (in luteal this equals
  // daysUntilNextPhase, but the formula holds for every phase).
  const daysToPeriod = config.cycleLength - info.cycleDay + 1;
  return {
    phase: info.phase,
    cycleDay: info.cycleDay,
    cycleLength: config.cycleLength,
    ringDeg: Math.round((info.cycleDay / config.cycleLength) * 360),
    batteryPct: copy.batteryPct,
    batteryLabel: copy.batteryLabel,
    headline: copy.headline(daysToPeriod),
    tip: copy.tip,
  };
}
