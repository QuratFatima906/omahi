/**
 * Per-phase, per-day suggestion content and the deterministic daily pick.
 *
 * Content lives in per-locale JSON (`data/suggestions.en.json`) so future
 * voice packs drop in without a refactor. Every string is a lifestyle
 * suggestion, reviewed by the product owner — never medical advice; keep the
 * in-app disclaimers intact when rendering it.
 */

import { parseIsoDate, CycleConfigError, type CycleConfig } from './cycle-config';
import { getPhase, MS_PER_DAY, type Phase, type PhaseInfo } from './phase-engine';
import suggestionsEnJson from './data/suggestions.en.json';

/** The four daily focus areas shown on the dashboard and new-tab page. */
export interface FocusContent {
  work: string;
  food: string;
  move: string;
  rest: string;
}

/**
 * Optional per-`dayOfPhase` overrides layered on a phase's base content.
 * Entry 0 applies to dayOfPhase 1; days past the last entry clamp to it.
 */
export interface PhaseDayVariant extends Partial<FocusContent> {
  hero?: string;
}

export interface PhaseContent {
  /** Short headline for the phase card, e.g. "Big-idea energy". */
  hero: string;
  base: FocusContent;
  dayVariants: PhaseDayVariant[];
  /** Rotating daily tips; picked deterministically by date. */
  tips: string[];
}

export type SuggestionsData = Record<Phase, PhaseContent>;

// Assigning the JSON to the typed constant is the schema check: a missing
// phase or field fails compilation.
export const SUGGESTIONS_EN: SuggestionsData = suggestionsEnJson;

/** Display names for phases (data keys stay lowercase domain terms). */
export const PHASE_LABELS: Record<Phase, string> = {
  menstruation: 'Menstruation',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
};

/**
 * The phase's content for a given day of the phase: base fields with the
 * day's variant (clamped to the last authored one) layered on top.
 */
export function resolveDayContent(
  content: PhaseContent,
  dayOfPhase: number,
): FocusContent & { hero: string } {
  const variant = content.dayVariants[Math.min(dayOfPhase, content.dayVariants.length) - 1] ?? {};
  return {
    hero: variant.hero ?? content.hero,
    work: variant.work ?? content.base.work,
    food: variant.food ?? content.base.food,
    move: variant.move ?? content.base.move,
    rest: variant.rest ?? content.base.rest,
  };
}

/**
 * Deterministic daily tip: index walks the pool one step per calendar day,
 * offset by the anchor date so two users on different anchors see different
 * sequences. Same config + date → same tip, no wall-clock reads.
 */
export function pickTip(tips: readonly string[], anchorDate: string, today: Date): string {
  if (tips.length === 0) {
    throw new RangeError('tips must not be empty');
  }
  const anchorMs = parseIsoDate(anchorDate);
  if (anchorMs === null) {
    throw new CycleConfigError('anchorDate', `invalid anchorDate "${anchorDate}"`);
  }
  const daySerial = Math.floor(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / MS_PER_DAY,
  );
  const anchorSerial = anchorMs / MS_PER_DAY;
  const index = (((daySerial + anchorSerial) % tips.length) + tips.length) % tips.length;
  return tips[index] as string;
}

export interface DailySuggestion extends PhaseInfo {
  hero: string;
  work: string;
  food: string;
  move: string;
  rest: string;
  tip: string;
}

/** Everything the dashboard needs for one day. Throws CycleConfigError on an invalid config. */
export function getDailySuggestion(
  config: CycleConfig,
  today: Date,
  data: SuggestionsData = SUGGESTIONS_EN,
): DailySuggestion {
  const info = getPhase(config, today);
  const content = data[info.phase];
  return {
    ...info,
    ...resolveDayContent(content, info.dayOfPhase),
    tip: pickTip(content.tips, config.anchorDate, today),
  };
}

/** "Ovulation window opens in 6 days" — the phase card's next-up line. */
export function getNextPhaseLine(info: PhaseInfo): string {
  const days = info.daysUntilNextPhase === 1 ? '1 day' : `${info.daysUntilNextPhase} days`;
  switch (info.nextPhase) {
    case 'menstruation':
      return `Next period predicted in ${days}`;
    case 'follicular':
      return `Follicular begins in ${days}`;
    case 'ovulation':
      return `Ovulation window opens in ${days}`;
    case 'luteal':
      return `Luteal begins in ${days}`;
  }
}
