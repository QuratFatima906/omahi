/**
 * @omahi/core — pure cycle-phase logic. No browser APIs allowed in this package.
 */
export {
  CycleConfigError,
  createDefaultCycleConfig,
  parseIsoDate,
  validateCycleConfig,
  DEFAULT_CYCLE_LENGTH,
  DEFAULT_PERIOD_LENGTH,
  MAX_CYCLE_LENGTH,
  MAX_PERIOD_LENGTH,
  MIN_CYCLE_LENGTH,
  MIN_PERIOD_LENGTH,
  type CycleConfig,
  type CycleConfigField,
} from './cycle-config';
export {
  getForecast,
  getPhase,
  getPhaseLengths,
  MS_PER_DAY,
  PHASES,
  type ForecastDay,
  type Phase,
  type PhaseInfo,
} from './phase-engine';
export {
  getDailySuggestion,
  getNextPhaseLine,
  PHASE_LABELS,
  pickTip,
  resolveDayContent,
  SUGGESTIONS_EN,
  type DailySuggestion,
  type FocusContent,
  type PhaseContent,
  type PhaseDayVariant,
  type SuggestionsData,
} from './suggestions';
