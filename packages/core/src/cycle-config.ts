/**
 * Cycle configuration: types, limits, defaults, and validation.
 */

export const MIN_CYCLE_LENGTH = 21;
export const MAX_CYCLE_LENGTH = 40;
export const MIN_PERIOD_LENGTH = 2;
export const MAX_PERIOD_LENGTH = 8;

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;

export interface CycleConfig {
  /** Most recent known period start, as a calendar date `YYYY-MM-DD`. Day 1 of the cycle. */
  anchorDate: string;
  /** Full cycle length in days (21–40). */
  cycleLength: number;
  /** Period (menstruation) length in days (2–8). */
  periodLength: number;
}

export type CycleConfigField = keyof CycleConfig;

/** Thrown by {@link validateCycleConfig} when a config value is out of range or malformed. */
export class CycleConfigError extends Error {
  readonly field: CycleConfigField;

  constructor(field: CycleConfigField, message: string) {
    super(message);
    this.name = 'CycleConfigError';
    this.field = field;
  }
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parse a `YYYY-MM-DD` string into UTC-midnight milliseconds, or `null` if the
 * string is malformed or names a day that doesn't exist (e.g. 2026-02-30).
 */
export function parseIsoDate(value: string): number | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ms = Date.UTC(year, month - 1, day);
  const roundTrip = new Date(ms);
  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() !== month - 1 ||
    roundTrip.getUTCDate() !== day
  ) {
    return null;
  }
  return ms;
}

/** Validate a config, throwing a {@link CycleConfigError} naming the offending field. */
export function validateCycleConfig(config: CycleConfig): void {
  if (parseIsoDate(config.anchorDate) === null) {
    throw new CycleConfigError(
      'anchorDate',
      `anchorDate must be a valid calendar date in YYYY-MM-DD form, got "${config.anchorDate}"`,
    );
  }
  if (
    !Number.isInteger(config.cycleLength) ||
    config.cycleLength < MIN_CYCLE_LENGTH ||
    config.cycleLength > MAX_CYCLE_LENGTH
  ) {
    throw new CycleConfigError(
      'cycleLength',
      `cycleLength must be an integer between ${MIN_CYCLE_LENGTH} and ${MAX_CYCLE_LENGTH}, got ${config.cycleLength}`,
    );
  }
  if (
    !Number.isInteger(config.periodLength) ||
    config.periodLength < MIN_PERIOD_LENGTH ||
    config.periodLength > MAX_PERIOD_LENGTH
  ) {
    throw new CycleConfigError(
      'periodLength',
      `periodLength must be an integer between ${MIN_PERIOD_LENGTH} and ${MAX_PERIOD_LENGTH}, got ${config.periodLength}`,
    );
  }
}

/** Build a config from an anchor date using the default 28/5 cycle. */
export function createDefaultCycleConfig(anchorDate: string): CycleConfig {
  const config: CycleConfig = {
    anchorDate,
    cycleLength: DEFAULT_CYCLE_LENGTH,
    periodLength: DEFAULT_PERIOD_LENGTH,
  };
  validateCycleConfig(config);
  return config;
}
