/**
 * Pure view-model for the new-tab page (private-by-default design): one
 * frosted widget — cycle-ring progress, a NEUTRAL title/subtitle, one tip —
 * plus pure clock/greeting formatters so the component stays free of date
 * logic.
 *
 * Privacy split (see the "Omahi New Tab - Private" design handoff): the
 * always-visible copy (`title`, `subtitle`, `tip`) must read like a generic
 * energy coach to anyone glancing at the screen — never a cycle word, never a
 * day count. Everything identifying (`phase`, `cycleDay`, `statusLine`,
 * including the luteal period countdown) renders only inside the widget's
 * tap-to-reveal detail chip.
 *
 * Copy is per-phase for now. If we later author per-day copy, extend
 * `PHASE_COPY` to key on `cycleDay` — the component renders whatever this
 * model returns.
 */

import { getPhase, type CycleConfig, type Phase } from '@omahi/core';

export interface NewTabModel {
  /** Identifying — revealed detail chip only, never the resting card. */
  phase: Phase;
  /** Identifying — revealed detail chip only, never the resting card. */
  cycleDay: number;
  cycleLength: number;
  /** 0–1 cycle progress for the widget's SVG ring stroke. */
  ringFraction: number;
  /** Neutral widget title ("Peak week") — safe for shoulder-surfers. */
  title: string;
  /** Neutral line under the title ("Good time for bold moves"). */
  subtitle: string;
  /** Identifying status line (incl. period countdown) — revealed chip only. */
  statusLine: string;
  tip: string;
}

interface PhaseCopy {
  title: string;
  subtitle: string;
  statusLine: (daysToPeriod: number) => string;
  tip: string;
}

/** The luteal status line switches to a period countdown this close to day 1. */
const COUNTDOWN_WINDOW_DAYS = 7;

// Copy is final per the private new-tab design handoff: non-prescriptive,
// permission-framed — never verdict language. title/subtitle/tip must stay
// neutral (no cycle vocabulary); statusLine is the one identifying string.
const PHASE_COPY: Record<Phase, PhaseCopy> = {
  menstruation: {
    title: 'Slow week',
    subtitle: 'Lighter load, on purpose',
    statusLine: () => 'Rest counts as progress today',
    tip: 'Clear the small stuff and protect your rest — the big swings can wait a few days.',
  },
  follicular: {
    title: 'Fresh start',
    subtitle: 'Ideas come easy now',
    statusLine: () => 'Energy is climbing this week',
    tip: "Open the project you've been circling — starting feels easier this week.",
  },
  ovulation: {
    title: 'Peak week',
    subtitle: 'Good time for bold moves',
    statusLine: () => 'Peak energy · your best week',
    tip: "Schedule the hard conversation or big pitch — you'll land it best now.",
  },
  luteal: {
    title: 'Focus week',
    subtitle: 'Sharp on the details',
    statusLine: (daysToPeriod) =>
      daysToPeriod <= COUNTDOWN_WINDOW_DAYS
        ? `Period expected in ~${daysToPeriod} ${daysToPeriod === 1 ? 'day' : 'days'}`
        : 'Steady energy — good week to finish things',
    tip: 'Finish, edit and tie up loose ends — save new launches for later.',
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
    title: copy.title,
    subtitle: copy.subtitle,
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
