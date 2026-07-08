/**
 * Phase engine: pure date math from a validated CycleConfig to phase info.
 *
 * Model (a heuristic, surfaced to users as an estimate, not medical advice):
 * - Day 1 = period start.
 * - Menstruation: day 1 → periodLength.
 * - Ovulation day ≈ cycleLength − 14 (luteal length is the stabler half),
 *   with a ±1-day window.
 * - Follicular: end of period → start of ovulation window.
 * - Luteal: end of ovulation window → cycleLength.
 *
 * When a long period would overlap the ovulation window (short cycle + long
 * period), menstruation wins: the window start is clamped to the day after the
 * period ends (its end stays put, so it may shrink to a single day) and the
 * follicular phase may be empty. Phases always partition the cycle with no
 * gaps or overlaps.
 */

import { parseIsoDate, validateCycleConfig, type CycleConfig } from './cycle-config';

export const PHASES = ['menstruation', 'follicular', 'ovulation', 'luteal'] as const;

export type Phase = (typeof PHASES)[number];

export interface PhaseInfo {
  phase: Phase;
  /** 1-based day within the cycle (1 = period start). */
  cycleDay: number;
  /** 1-based day within the current phase. */
  dayOfPhase: number;
  /** The phase that follows (skips an empty follicular phase; luteal wraps to menstruation). */
  nextPhase: Phase;
  /** Whole days until nextPhase begins (≥ 1). */
  daysUntilNextPhase: number;
}

export interface ForecastDay extends PhaseInfo {
  /** Calendar date `YYYY-MM-DD`. */
  date: string;
}

/** Inclusive 1-based cycle-day ranges for each phase. An empty phase has end < start. */
interface PhaseRanges {
  menstruation: { start: number; end: number };
  follicular: { start: number; end: number };
  ovulation: { start: number; end: number };
  luteal: { start: number; end: number };
}

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LUTEAL_HEURISTIC_DAYS = 14;

function getPhaseRanges(config: CycleConfig): PhaseRanges {
  const { cycleLength, periodLength } = config;
  const ovulationDay = cycleLength - LUTEAL_HEURISTIC_DAYS;
  const ovulationStart = Math.max(periodLength + 1, ovulationDay - 1);
  const ovulationEnd = Math.max(ovulationStart, ovulationDay + 1);
  return {
    menstruation: { start: 1, end: periodLength },
    follicular: { start: periodLength + 1, end: ovulationStart - 1 },
    ovulation: { start: ovulationStart, end: ovulationEnd },
    luteal: { start: ovulationEnd + 1, end: cycleLength },
  };
}

/** UTC-midnight ms for a Date's calendar date, ignoring its time-of-day and timezone offset. */
function toUtcMidnight(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatIsoDate(utcMs: number): string {
  return new Date(utcMs).toISOString().slice(0, 10);
}

function phaseInfoAt(config: CycleConfig, anchorMs: number, utcMidnightMs: number): PhaseInfo {
  const diffDays = Math.round((utcMidnightMs - anchorMs) / MS_PER_DAY);
  const { cycleLength } = config;
  const cycleDay = (((diffDays % cycleLength) + cycleLength) % cycleLength) + 1;

  const ranges = getPhaseRanges(config);
  const phase = PHASES.find(
    (name) => cycleDay >= ranges[name].start && cycleDay <= ranges[name].end,
  ) as Phase;

  const order = PHASES.filter((name) => ranges[name].end >= ranges[name].start);
  const nextPhase = order[(order.indexOf(phase) + 1) % order.length] as Phase;

  return {
    phase,
    cycleDay,
    dayOfPhase: cycleDay - ranges[phase].start + 1,
    nextPhase,
    daysUntilNextPhase: ranges[phase].end + 1 - cycleDay,
  };
}

/**
 * Days each phase spans in one cycle (an empty follicular phase yields 0).
 * Sums to cycleLength. Throws CycleConfigError on an invalid config.
 */
export function getPhaseLengths(config: CycleConfig): Record<Phase, number> {
  validateCycleConfig(config);
  const ranges = getPhaseRanges(config);
  return Object.fromEntries(
    PHASES.map((phase) => [phase, Math.max(0, ranges[phase].end - ranges[phase].start + 1)]),
  ) as Record<Phase, number>;
}

/**
 * Compute phase info for a calendar date. Dates before the anchor wrap
 * backwards into hypothetical earlier cycles; dates far after wrap forwards.
 * Throws CycleConfigError on an invalid config.
 */
export function getPhase(config: CycleConfig, today: Date): PhaseInfo {
  validateCycleConfig(config);
  const anchorMs = parseIsoDate(config.anchorDate) as number;
  return phaseInfoAt(config, anchorMs, toUtcMidnight(today));
}

/**
 * Phase info for `days` consecutive calendar days starting at `fromDate`.
 * Throws CycleConfigError on an invalid config and RangeError when days < 1.
 */
export function getForecast(config: CycleConfig, fromDate: Date, days: number): ForecastDay[] {
  validateCycleConfig(config);
  if (!Number.isInteger(days) || days < 1) {
    throw new RangeError(`days must be a positive integer, got ${days}`);
  }
  const anchorMs = parseIsoDate(config.anchorDate) as number;
  const startMs = toUtcMidnight(fromDate);
  return Array.from({ length: days }, (_, i) => {
    const dayMs = startMs + i * MS_PER_DAY;
    return { date: formatIsoDate(dayMs), ...phaseInfoAt(config, anchorMs, dayMs) };
  });
}
