/**
 * Pure view-model for the new-tab page (Glass Board design): one frosted
 * widget — cycle-ring progress, a per-phase status line, one tip — plus pure
 * clock/greeting formatters so the component stays free of date logic.
 *
 * Copy is per-phase for now (finalized in the new-tab design handoff). If we
 * later author per-day copy, extend `PHASE_COPY` to key on `cycleDay` — the
 * component renders whatever this model returns.
 */

import { getPhase, type CycleConfig, type Phase } from '@omahi/core';

export interface NewTabModel {
  phase: Phase;
  cycleDay: number;
  cycleLength: number;
  /** 0–1 cycle progress for the widget's SVG ring stroke. */
  ringFraction: number;
  /** Status line under the phase title inside the widget. */
  statusLine: string;
  /** Rendered after the "One thing for today:" lead-in. */
  tip: string;
}

interface PhaseCopy {
  statusLine: (daysToPeriod: number) => string;
  tip: string;
}

/** The luteal status line switches to a period countdown this close to day 1. */
const COUNTDOWN_WINDOW_DAYS = 7;

// Copy is final per the design handoff: non-prescriptive, permission-framed —
// never verdict language. Keep that register when editing.
const PHASE_COPY: Record<Phase, PhaseCopy> = {
  menstruation: {
    statusLine: () => 'Rest counts as progress today',
    tip: 'keep the schedule light — cancel or move one thing if you can.',
  },
  follicular: {
    statusLine: () => 'Energy is climbing this week',
    tip: "open the project you've been putting off — starting feels easier this week.",
  },
  ovulation: {
    statusLine: () => 'Peak energy · your best week',
    tip: "schedule the hard conversation or big pitch — you'll land it best now.",
  },
  luteal: {
    statusLine: (daysToPeriod) =>
      daysToPeriod <= COUNTDOWN_WINDOW_DAYS
        ? `Period expected in ~${daysToPeriod} ${daysToPeriod === 1 ? 'day' : 'days'}`
        : 'Steady energy — good week to finish things',
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
    ringFraction: info.cycleDay / config.cycleLength,
    statusLine: copy.statusLine(daysToPeriod),
    tip: copy.tip,
  };
}

export function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Locale-aware wall-clock time without the day period — the greeting already
 * says which half of the day it is (12h locales get "9:41", 24h get "14:15").
 * `locale` is a test seam; production callers omit it (system locale).
 */
export function formatClock(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
    .formatToParts(date)
    .filter((part) => part.type !== 'dayPeriod')
    .map((part) => part.value)
    .join('')
    .trim();
}

/** "Friday, July 10" (localized). `locale` is a test seam like formatClock's. */
export function formatDateLine(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
