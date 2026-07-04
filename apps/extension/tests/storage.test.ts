import { describe, expect, it } from 'vitest';
import {
  CORRUPT_BACKUP_KEY,
  createDefaultSettings,
  createEmptyState,
  createOmahiStorage,
  exportStateJson,
  importStateJson,
  migrateState,
  SCHEMA_VERSION,
  STORAGE_KEY,
  StorageSchemaError,
  validateState,
  type OmahiState,
  type StorageAreaLike,
} from '../lib/storage';

const validConfig = { anchorDate: '2026-06-20', cycleLength: 28, periodLength: 5 };

function validState(): OmahiState {
  return {
    schemaVersion: 2,
    cycleConfig: validConfig,
    periodLog: [{ start: '2026-06-20' }],
    settings: { newTabEnabled: true },
  };
}

/** A valid v2 state to spread invalid single fields into. */
function base(): Record<string, unknown> {
  return {
    schemaVersion: 2,
    cycleConfig: null,
    periodLog: [],
    settings: { newTabEnabled: false },
  };
}

/** In-memory StorageAreaLike so tests exercise the real wrapper. */
function createFakeArea(initial: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = { ...initial };
  let setCalls = 0;
  return {
    area: {
      get: (key: string) => Promise.resolve(key in data ? { [key]: data[key] } : {}),
      set: (items: Record<string, unknown>) => {
        Object.assign(data, items);
        setCalls += 1;
        return Promise.resolve();
      },
    } satisfies StorageAreaLike,
    data,
    getSetCalls: () => setCalls,
  };
}

describe('validateState', () => {
  it('accepts an empty state', () => {
    expect(validateState(createEmptyState())).toEqual({
      schemaVersion: SCHEMA_VERSION,
      cycleConfig: null,
      periodLog: [],
      settings: { newTabEnabled: false },
    });
  });

  it('accepts a full valid state', () => {
    expect(validateState(validState())).toEqual(validState());
  });

  it.each([
    ['non-object', 42],
    ['null', null],
    ['array', []],
    ['missing schemaVersion', { ...base(), schemaVersion: undefined }],
    ['wrong schemaVersion', { ...base(), schemaVersion: 99 }],
    ['outdated schemaVersion', { ...base(), schemaVersion: 1 }],
    ['string schemaVersion', { ...base(), schemaVersion: '2' }],
    ['cycleConfig not object', { ...base(), cycleConfig: 'x' }],
    [
      'cycleConfig non-string anchorDate',
      { ...base(), cycleConfig: { ...validConfig, anchorDate: ['2026-06-20'] } },
    ],
    [
      'cycleConfig non-number cycleLength',
      { ...base(), cycleConfig: { ...validConfig, cycleLength: '28' } },
    ],
    ['cycleConfig out of range', { ...base(), cycleConfig: { ...validConfig, cycleLength: 99 } }],
    [
      'cycleConfig bad anchorDate',
      { ...base(), cycleConfig: { ...validConfig, anchorDate: '2026-02-30' } },
    ],
    ['periodLog not array', { ...base(), periodLog: {} }],
    ['periodLog entry not object', { ...base(), periodLog: ['x'] }],
    ['periodLog entry bad date', { ...base(), periodLog: [{ start: 'not-a-date' }] }],
    ['missing settings', { ...base(), settings: undefined }],
    ['settings not object', { ...base(), settings: true }],
    ['settings non-boolean newTabEnabled', { ...base(), settings: { newTabEnabled: 'yes' } }],
  ])('rejects %s', (_name, value) => {
    expect(() => validateState(value)).toThrow(StorageSchemaError);
  });

  it('strips unknown fields from periodLog entries', () => {
    const state = validateState({ ...base(), periodLog: [{ start: '2026-06-20', extra: true }] });
    expect(state.periodLog).toEqual([{ start: '2026-06-20' }]);
  });

  it('strips unknown fields from cycleConfig', () => {
    const state = validateState({ ...base(), cycleConfig: { ...validConfig, junk: true } });
    expect(state.cycleConfig).toEqual(validConfig);
  });

  it('strips unknown fields from settings', () => {
    const state = validateState({ ...base(), settings: { newTabEnabled: true, junk: 1 } });
    expect(state.settings).toEqual({ newTabEnabled: true });
  });
});

describe('migrateState', () => {
  it('returns an empty state when nothing is stored', () => {
    expect(migrateState(undefined)).toEqual(createEmptyState());
    expect(migrateState(null)).toEqual(createEmptyState());
  });

  it('passes a current-version state through unchanged', () => {
    expect(migrateState(validState())).toEqual(validState());
  });

  it('lifts a pre-versioned (v0) state to v2', () => {
    expect(migrateState({ cycleConfig: validConfig })).toEqual({
      schemaVersion: 2,
      cycleConfig: validConfig,
      periodLog: [],
      settings: createDefaultSettings(),
    });
  });

  it('lifts an empty v0 object to an empty v2 state', () => {
    expect(migrateState({})).toEqual(createEmptyState());
  });

  it('lifts a v1 state to v2 with default settings, preserving data', () => {
    const v1 = {
      schemaVersion: 1,
      cycleConfig: validConfig,
      periodLog: [{ start: '2026-06-20' }],
    };
    expect(migrateState(v1)).toEqual({
      schemaVersion: 2,
      cycleConfig: validConfig,
      periodLog: [{ start: '2026-06-20' }],
      settings: { newTabEnabled: false },
    });
  });

  it('rejects a state from a newer app version', () => {
    expect(() => migrateState({ schemaVersion: SCHEMA_VERSION + 1 })).toThrow(StorageSchemaError);
  });

  it.each([
    ['non-object', 'hello'],
    ['negative version', { schemaVersion: -1 }],
    ['explicit version 0', { schemaVersion: 0 }],
    ['fractional version', { schemaVersion: 0.5 }],
    ['string version', { ...base(), schemaVersion: '2' }],
    ['migrated-but-invalid payload', { cycleConfig: { ...validConfig, periodLength: 99 } }],
  ])('rejects %s', (_name, value) => {
    expect(() => migrateState(value)).toThrow(StorageSchemaError);
  });
});

describe('export / import JSON', () => {
  it('round-trips a state', () => {
    expect(importStateJson(exportStateJson(validState()))).toEqual(validState());
  });

  it('export validates before serializing', () => {
    const broken = { ...validState(), periodLog: 'nope' } as unknown as OmahiState;
    expect(() => exportStateJson(broken)).toThrow(StorageSchemaError);
  });

  it('import rejects malformed JSON', () => {
    expect(() => importStateJson('{not json')).toThrow(StorageSchemaError);
    expect(() => importStateJson('')).toThrow(StorageSchemaError);
  });

  it('import rejects valid JSON with an invalid schema', () => {
    const broken = JSON.stringify({ ...base(), periodLog: 'x' });
    expect(() => importStateJson(broken)).toThrow(StorageSchemaError);
  });

  it('import migrates a v0 backup', () => {
    expect(importStateJson(JSON.stringify({ cycleConfig: validConfig }))).toEqual({
      schemaVersion: 2,
      cycleConfig: validConfig,
      periodLog: [],
      settings: createDefaultSettings(),
    });
  });

  it('import migrates a v1 backup', () => {
    const v1 = { schemaVersion: 1, cycleConfig: validConfig, periodLog: [] };
    expect(importStateJson(JSON.stringify(v1))).toEqual({
      schemaVersion: 2,
      cycleConfig: validConfig,
      periodLog: [],
      settings: createDefaultSettings(),
    });
  });
});

describe('createOmahiStorage', () => {
  it('load returns an empty state without writing when storage is empty', async () => {
    const { area, getSetCalls } = createFakeArea();
    const storage = createOmahiStorage(area);
    expect(await storage.load()).toEqual(createEmptyState());
    expect(getSetCalls()).toBe(0);
  });

  it('save then load round-trips', async () => {
    const { area } = createFakeArea();
    const storage = createOmahiStorage(area);
    await storage.save(validState());
    expect(await storage.load()).toEqual(validState());
  });

  it('save rejects an invalid state and writes nothing', async () => {
    const { area, getSetCalls } = createFakeArea();
    const storage = createOmahiStorage(area);
    const broken = { ...validState(), schemaVersion: 99 } as unknown as OmahiState;
    await expect(storage.save(broken)).rejects.toThrow(StorageSchemaError);
    expect(getSetCalls()).toBe(0);
  });

  it('load migrates stored v0 data and persists the migration once', async () => {
    const { area, data, getSetCalls } = createFakeArea({
      [STORAGE_KEY]: { cycleConfig: validConfig },
    });
    const storage = createOmahiStorage(area);
    const expected = {
      schemaVersion: 2,
      cycleConfig: validConfig,
      periodLog: [],
      settings: createDefaultSettings(),
    };
    expect(await storage.load()).toEqual(expected);
    expect(data[STORAGE_KEY]).toEqual(expected);
    expect(getSetCalls()).toBe(1);
    await storage.load();
    expect(getSetCalls()).toBe(1);
  });

  it('load migrates stored v1 data and persists the migration once', async () => {
    const { area, data, getSetCalls } = createFakeArea({
      [STORAGE_KEY]: { schemaVersion: 1, cycleConfig: validConfig, periodLog: [] },
    });
    const storage = createOmahiStorage(area);
    const expected = {
      schemaVersion: 2,
      cycleConfig: validConfig,
      periodLog: [],
      settings: createDefaultSettings(),
    };
    expect(await storage.load()).toEqual(expected);
    expect(data[STORAGE_KEY]).toEqual(expected);
    expect(getSetCalls()).toBe(1);
    await storage.load();
    expect(getSetCalls()).toBe(1);
  });

  it('load quarantines corrupt stored data and starts fresh instead of bricking', async () => {
    const { area, data } = createFakeArea({ [STORAGE_KEY]: 'corrupt' });
    const storage = createOmahiStorage(area);
    expect(await storage.load()).toEqual(createEmptyState());
    expect(data[CORRUPT_BACKUP_KEY]).toBe('corrupt');
    expect(data[STORAGE_KEY]).toEqual(createEmptyState());
    expect(await storage.load()).toEqual(createEmptyState());
  });

  it('saveCycleConfig preserves the rest of the state', async () => {
    const { area } = createFakeArea({
      [STORAGE_KEY]: {
        ...base(),
        periodLog: [{ start: '2026-05-23' }],
        settings: { newTabEnabled: true },
      },
    });
    const storage = createOmahiStorage(area);
    const state = await storage.saveCycleConfig(validConfig);
    expect(state).toEqual({
      schemaVersion: 2,
      cycleConfig: validConfig,
      periodLog: [{ start: '2026-05-23' }],
      settings: { newTabEnabled: true },
    });
    expect(await storage.load()).toEqual(state);
  });

  it('saveCycleConfig rejects an out-of-range config', async () => {
    const { area } = createFakeArea();
    const storage = createOmahiStorage(area);
    await expect(storage.saveCycleConfig({ ...validConfig, cycleLength: 5 })).rejects.toThrow(
      StorageSchemaError,
    );
  });

  it('completeOnboarding persists config and settings in one write, preserving periodLog', async () => {
    const { area, getSetCalls } = createFakeArea({
      [STORAGE_KEY]: { ...base(), periodLog: [{ start: '2026-05-23' }] },
    });
    const storage = createOmahiStorage(area);
    const state = await storage.completeOnboarding(validConfig, { newTabEnabled: true });
    expect(state).toEqual({
      schemaVersion: 2,
      cycleConfig: validConfig,
      periodLog: [{ start: '2026-05-23' }],
      settings: { newTabEnabled: true },
    });
    expect(getSetCalls()).toBe(1);
    expect(await storage.load()).toEqual(state);
  });

  it('completeOnboarding rejects an invalid config and writes nothing', async () => {
    const { area, getSetCalls } = createFakeArea();
    const storage = createOmahiStorage(area);
    await expect(
      storage.completeOnboarding({ ...validConfig, periodLength: 99 }, { newTabEnabled: false }),
    ).rejects.toThrow(StorageSchemaError);
    expect(getSetCalls()).toBe(0);
  });

  it('logPeriod appends and persists', async () => {
    const { area } = createFakeArea({ [STORAGE_KEY]: { ...base(), cycleConfig: validConfig } });
    const storage = createOmahiStorage(area);
    const state = await storage.logPeriod('2026-07-18');
    expect(state.periodLog).toEqual([{ start: '2026-07-18' }]);
    const again = await storage.logPeriod('2026-08-15');
    expect(again.periodLog).toEqual([{ start: '2026-07-18' }, { start: '2026-08-15' }]);
    expect(await storage.load()).toEqual(again);
  });

  it('logPeriod is a no-op for an already-logged date', async () => {
    const { area, getSetCalls } = createFakeArea({
      [STORAGE_KEY]: { ...base(), periodLog: [{ start: '2026-07-18' }] },
    });
    const storage = createOmahiStorage(area);
    const state = await storage.logPeriod('2026-07-18');
    expect(state.periodLog).toEqual([{ start: '2026-07-18' }]);
    expect(getSetCalls()).toBe(0);
  });

  it('logPeriod rejects an invalid date and writes nothing', async () => {
    const { area, getSetCalls } = createFakeArea();
    const storage = createOmahiStorage(area);
    await expect(storage.logPeriod('2026-02-30')).rejects.toThrow(StorageSchemaError);
    expect(getSetCalls()).toBe(0);
  });

  it('undoLastPeriod removes the most recent entry only', async () => {
    const { area } = createFakeArea({
      [STORAGE_KEY]: { ...base(), periodLog: [{ start: '2026-07-18' }, { start: '2026-08-15' }] },
    });
    const storage = createOmahiStorage(area);
    const state = await storage.undoLastPeriod();
    expect(state.periodLog).toEqual([{ start: '2026-07-18' }]);
    expect(await storage.load()).toEqual(state);
  });

  it('undoLastPeriod is a no-op on an empty log', async () => {
    const { area, getSetCalls } = createFakeArea({ [STORAGE_KEY]: base() });
    const storage = createOmahiStorage(area);
    const state = await storage.undoLastPeriod();
    expect(state.periodLog).toEqual([]);
    expect(getSetCalls()).toBe(0);
  });
});
