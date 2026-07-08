/**
 * Versioned storage layer over `chrome.storage.local`.
 *
 * The whole app state lives under one key as a schema-versioned object, with
 * a migration step run on every load. The browser binding is injected
 * (`createOmahiStorage(area)`) so unit tests can pass an in-memory area and
 * exercise the real wrapper, not a mock of it.
 */

import { parseIsoDate, validateCycleConfig, type CycleConfig } from '@omahi/core';
import { browser } from 'wxt/browser';

export const SCHEMA_VERSION = 3;
export const STORAGE_KEY = 'omahi';
/** Where load() parks unreadable stored data instead of bricking on it. */
export const CORRUPT_BACKUP_KEY = 'omahi-corrupt';

/** One logged period. Start-only for now; Chunk 7 (manual override) builds on this. */
export interface PeriodLogEntry {
  /** Period start, `YYYY-MM-DD`. */
  start: string;
}

/** User preferences. Collected during onboarding; editable in settings (Chunk 8). */
export interface OmahiSettings {
  /** Whether the new-tab page override is on (Chunk 9 consumes this). */
  newTabEnabled: boolean;
  /**
   * Privacy screen for the new tab: when on, the dashboard collapses to a
   * clock-only view (safe to screen-share) until the user turns it back off.
   */
  quietMode: boolean;
}

export interface OmahiState {
  schemaVersion: typeof SCHEMA_VERSION;
  /** `null` until onboarding completes. */
  cycleConfig: CycleConfig | null;
  periodLog: PeriodLogEntry[];
  settings: OmahiSettings;
}

/** Thrown when stored or imported data doesn't match the schema. */
export class StorageSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageSchemaError';
  }
}

/**
 * Settings for users who never answered the new-tab question (pre-v2 states
 * and fresh installs before onboarding): off, so an update never hijacks the
 * new tab without consent. Onboarding sets it explicitly.
 */
export function createDefaultSettings(): OmahiSettings {
  return { newTabEnabled: false, quietMode: false };
}

export function createEmptyState(): OmahiState {
  return {
    schemaVersion: SCHEMA_VERSION,
    cycleConfig: null,
    periodLog: [],
    settings: createDefaultSettings(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validate an unknown value as a v1 state, throwing {@link StorageSchemaError}. */
export function validateState(value: unknown): OmahiState {
  if (!isRecord(value)) {
    throw new StorageSchemaError(`state must be an object, got ${typeof value}`);
  }
  if (value.schemaVersion !== SCHEMA_VERSION) {
    throw new StorageSchemaError(
      `state.schemaVersion must be ${SCHEMA_VERSION}, got ${JSON.stringify(value.schemaVersion)}`,
    );
  }
  let cycleConfig: CycleConfig | null = null;
  if (value.cycleConfig !== null) {
    if (!isRecord(value.cycleConfig)) {
      throw new StorageSchemaError('state.cycleConfig must be an object or null');
    }
    // Rebuild from the known fields with explicit type checks: core's
    // validators assume well-typed input (its regex would coerce a non-string
    // anchorDate), and stored/imported junk fields must not round-trip.
    const { anchorDate, cycleLength, periodLength } = value.cycleConfig;
    if (
      typeof anchorDate !== 'string' ||
      typeof cycleLength !== 'number' ||
      typeof periodLength !== 'number'
    ) {
      throw new StorageSchemaError(
        'state.cycleConfig must have a string anchorDate and numeric cycleLength/periodLength',
      );
    }
    cycleConfig = { anchorDate, cycleLength, periodLength };
    try {
      validateCycleConfig(cycleConfig);
    } catch (error) {
      throw new StorageSchemaError(`state.cycleConfig is invalid: ${(error as Error).message}`);
    }
  }
  if (!Array.isArray(value.periodLog)) {
    throw new StorageSchemaError('state.periodLog must be an array');
  }
  // Note: schema validation is deliberately clock-free (no "not in the
  // future" rule here) — the calendar UI blocks future picks, and the JSON
  // import flow (Chunk 8) is responsible for warning on future-dated data.
  for (const [index, entry] of value.periodLog.entries()) {
    if (!isRecord(entry) || typeof entry.start !== 'string' || parseIsoDate(entry.start) === null) {
      throw new StorageSchemaError(
        `state.periodLog[${index}] must have a valid YYYY-MM-DD start date`,
      );
    }
  }
  if (
    !isRecord(value.settings) ||
    typeof value.settings.newTabEnabled !== 'boolean' ||
    typeof value.settings.quietMode !== 'boolean'
  ) {
    throw new StorageSchemaError(
      'state.settings must have boolean newTabEnabled and quietMode fields',
    );
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    cycleConfig,
    periodLog: (value.periodLog as PeriodLogEntry[]).map((entry) => ({ start: entry.start })),
    settings: {
      newTabEnabled: value.settings.newTabEnabled,
      quietMode: value.settings.quietMode,
    },
  };
}

/**
 * Per-version migration steps: `MIGRATIONS[n]` lifts a version-n state to
 * n+1. Version 0 is the pre-versioned shape (no `schemaVersion` field).
 */
const MIGRATIONS: Record<number, (state: Record<string, unknown>) => Record<string, unknown>> = {
  0: (state) => ({
    schemaVersion: 1,
    cycleConfig: state.cycleConfig ?? null,
    periodLog: state.periodLog ?? [],
  }),
  1: (state) => ({
    ...state,
    schemaVersion: 2,
    settings: { newTabEnabled: false },
  }),
  // Quiet mode starts off: an update must never hide an existing dashboard.
  2: (state) => ({
    ...state,
    schemaVersion: 3,
    settings: { ...(state.settings as Record<string, unknown>), quietMode: false },
  }),
};

/**
 * The schema version a raw stored object claims: absent = 0 (the
 * pre-versioned shape). A present but non-integer or out-of-range version is
 * corrupt or from a newer app — never guess, throw.
 */
function storedSchemaVersion(raw: Record<string, unknown>): number {
  if (!('schemaVersion' in raw)) {
    return 0;
  }
  const version = raw.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new StorageSchemaError(`invalid schemaVersion ${JSON.stringify(version)}`);
  }
  if (version > SCHEMA_VERSION) {
    throw new StorageSchemaError(
      `unsupported schemaVersion ${version} (this app supports up to ${SCHEMA_VERSION})`,
    );
  }
  return version;
}

/**
 * Lift raw stored data to the current schema and validate it.
 * `undefined`/`null` (nothing stored yet) becomes an empty state.
 */
export function migrateState(raw: unknown): OmahiState {
  if (raw === undefined || raw === null) {
    return createEmptyState();
  }
  if (!isRecord(raw)) {
    throw new StorageSchemaError(`stored state must be an object, got ${typeof raw}`);
  }
  let version = storedSchemaVersion(raw);
  let state = raw;
  while (version < SCHEMA_VERSION) {
    state = MIGRATIONS[version]!(state);
    version += 1;
  }
  return validateState(state);
}

/** Serialize a state for JSON backup (validates first). */
export function exportStateJson(state: OmahiState): string {
  return JSON.stringify(validateState(state), null, 2);
}

/** Parse a JSON backup, migrating older versions. Throws {@link StorageSchemaError}. */
export function importStateJson(json: string): OmahiState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new StorageSchemaError('the file is not valid JSON');
  }
  return migrateState(parsed);
}

/** The subset of `chrome.storage.local` the wrapper needs; injectable for tests. */
export interface StorageAreaLike {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export interface OmahiStorage {
  /** Load state, migrating (and persisting the migration) if needed. */
  load(): Promise<OmahiState>;
  /** Validate and persist a full state. */
  save(state: OmahiState): Promise<void>;
  /**
   * Merge a patch into the stored cycle config (the settings editor's
   * write). Patch-based so rapid successive edits can't clobber each other
   * via stale render-time props. When the anchor date changes, periodLog
   * entries dated after the new anchor are pruned — the anchor-precedence
   * rule (predictions use the latest of anchor and log) would otherwise
   * silently override the edit. Throws before onboarding.
   */
  saveCycleConfig(patch: Partial<CycleConfig>): Promise<OmahiState>;
  /** Flip the new-tab override from the stored value (not a caller snapshot). */
  toggleNewTab(): Promise<OmahiState>;
  /**
   * Flip quiet mode from the stored value. The ONE write the new-tab page is
   * allowed to make (see the concurrency note on `update`) — everything else
   * still goes through the popup.
   */
  toggleQuiet(): Promise<OmahiState>;
  /** Persist the onboarding result (config + settings) in one write. */
  completeOnboarding(config: CycleConfig, settings: OmahiSettings): Promise<OmahiState>;
  /** Append a period start (`YYYY-MM-DD`). No-op if that date is already logged. */
  logPeriod(start: string): Promise<OmahiState>;
  /** Remove the most recently logged period. No-op on an empty log. */
  undoLastPeriod(): Promise<OmahiState>;
  /** Erase everything back to the pre-onboarding empty state. */
  reset(): Promise<OmahiState>;
}

export function createOmahiStorage(area: StorageAreaLike): OmahiStorage {
  async function load(): Promise<OmahiState> {
    const items = await area.get(STORAGE_KEY);
    const raw = items[STORAGE_KEY];
    let state: OmahiState;
    try {
      state = migrateState(raw);
    } catch (error) {
      /* v8 ignore next 3 -- migrateState only throws StorageSchemaError */
      if (!(error instanceof StorageSchemaError)) {
        throw error;
      }
      // Unreadable data would brick every surface forever. Quarantine it for
      // manual recovery and start fresh instead.
      state = createEmptyState();
      await area.set({ [CORRUPT_BACKUP_KEY]: raw, [STORAGE_KEY]: state });
      return state;
    }
    if (isRecord(raw) && storedSchemaVersion(raw) !== SCHEMA_VERSION) {
      await area.set({ [STORAGE_KEY]: state });
    }
    return state;
  }

  async function save(state: OmahiState): Promise<void> {
    await area.set({ [STORAGE_KEY]: validateState(state) });
  }

  /**
   * Read-modify-write: load fresh (another surface may have written), patch,
   * save. NOT atomic — chrome.storage has no transactions, so two surfaces
   * writing simultaneously last-write-wins. Acceptable because the popup is
   * the only surface writing cycle data; the new-tab page stays read-only for
   * everything except `toggleQuiet` (a single-flag read-modify-write, so the
   * worst cross-surface race loses one toggle tap, never cycle data).
   */
  async function update(patch: Partial<OmahiState>): Promise<OmahiState> {
    const state = { ...(await load()), ...patch };
    await save(state);
    return state;
  }

  return {
    load,
    save,
    async saveCycleConfig(patch: Partial<CycleConfig>): Promise<OmahiState> {
      const state = await load();
      if (state.cycleConfig === null) {
        throw new StorageSchemaError('cannot edit the cycle config before onboarding');
      }
      const config = { ...state.cycleConfig, ...patch };
      const anchorChanged = state.cycleConfig.anchorDate !== config.anchorDate;
      const periodLog = anchorChanged
        ? state.periodLog.filter((entry) => entry.start <= config.anchorDate)
        : state.periodLog;
      const next = { ...state, cycleConfig: config, periodLog };
      await save(next);
      return next;
    },
    async toggleNewTab(): Promise<OmahiState> {
      const state = await load();
      const next = {
        ...state,
        settings: { ...state.settings, newTabEnabled: !state.settings.newTabEnabled },
      };
      await save(next);
      return next;
    },
    async toggleQuiet(): Promise<OmahiState> {
      const state = await load();
      const next = {
        ...state,
        settings: { ...state.settings, quietMode: !state.settings.quietMode },
      };
      await save(next);
      return next;
    },
    completeOnboarding: (config: CycleConfig, settings: OmahiSettings) =>
      update({ cycleConfig: config, settings }),
    async logPeriod(start: string): Promise<OmahiState> {
      const state = await load();
      if (state.periodLog.some((entry) => entry.start === start)) {
        return state;
      }
      const next = { ...state, periodLog: [...state.periodLog, { start }] };
      await save(next);
      return next;
    },
    async undoLastPeriod(): Promise<OmahiState> {
      const state = await load();
      if (state.periodLog.length === 0) {
        return state;
      }
      const next = { ...state, periodLog: state.periodLog.slice(0, -1) };
      await save(next);
      return next;
    },
    async reset(): Promise<OmahiState> {
      const state = createEmptyState();
      await save(state);
      return state;
    },
  };
}

/** App-wide instance bound to the real extension storage. */
/* v8 ignore start -- browser binding; exercised by e2e, not unit tests */
export const omahiStorage = createOmahiStorage({
  get: (key) => browser.storage.local.get(key),
  set: (items) => browser.storage.local.set(items),
});
/* v8 ignore stop */
