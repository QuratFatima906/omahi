import { describe, expect, it } from 'vitest';
import {
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
    schemaVersion: 1,
    cycleConfig: validConfig,
    periodLog: [{ start: '2026-06-20' }],
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
    });
  });

  it('accepts a full valid state', () => {
    expect(validateState(validState())).toEqual(validState());
  });

  it.each([
    ['non-object', 42],
    ['null', null],
    ['array', []],
    ['missing schemaVersion', { cycleConfig: null, periodLog: [] }],
    ['wrong schemaVersion', { schemaVersion: 99, cycleConfig: null, periodLog: [] }],
    ['string schemaVersion', { schemaVersion: '1', cycleConfig: null, periodLog: [] }],
    ['cycleConfig not object', { schemaVersion: 1, cycleConfig: 'x', periodLog: [] }],
    [
      'cycleConfig out of range',
      { schemaVersion: 1, cycleConfig: { ...validConfig, cycleLength: 99 }, periodLog: [] },
    ],
    [
      'cycleConfig bad anchorDate',
      {
        schemaVersion: 1,
        cycleConfig: { ...validConfig, anchorDate: '2026-02-30' },
        periodLog: [],
      },
    ],
    ['periodLog not array', { schemaVersion: 1, cycleConfig: null, periodLog: {} }],
    ['periodLog entry not object', { schemaVersion: 1, cycleConfig: null, periodLog: ['x'] }],
    [
      'periodLog entry bad date',
      { schemaVersion: 1, cycleConfig: null, periodLog: [{ start: 'not-a-date' }] },
    ],
  ])('rejects %s', (_name, value) => {
    expect(() => validateState(value)).toThrow(StorageSchemaError);
  });

  it('strips unknown fields from periodLog entries', () => {
    const state = validateState({
      schemaVersion: 1,
      cycleConfig: null,
      periodLog: [{ start: '2026-06-20', extra: true }],
    });
    expect(state.periodLog).toEqual([{ start: '2026-06-20' }]);
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

  it('lifts a pre-versioned (v0) state to v1', () => {
    expect(migrateState({ cycleConfig: validConfig })).toEqual({
      schemaVersion: 1,
      cycleConfig: validConfig,
      periodLog: [],
    });
  });

  it('lifts an empty v0 object to an empty v1 state', () => {
    expect(migrateState({})).toEqual(createEmptyState());
  });

  it('rejects a state from a newer app version', () => {
    expect(() => migrateState({ schemaVersion: SCHEMA_VERSION + 1 })).toThrow(StorageSchemaError);
  });

  it.each([
    ['non-object', 'hello'],
    ['negative version', { schemaVersion: -1 }],
    ['fractional version', { schemaVersion: 0.5 }],
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
    expect(() => importStateJson('{"schemaVersion":1,"cycleConfig":null,"periodLog":"x"}')).toThrow(
      StorageSchemaError,
    );
  });

  it('import migrates a v0 backup', () => {
    expect(importStateJson(JSON.stringify({ cycleConfig: validConfig }))).toEqual({
      schemaVersion: 1,
      cycleConfig: validConfig,
      periodLog: [],
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
    const broken = { ...validState(), schemaVersion: 2 } as unknown as OmahiState;
    await expect(storage.save(broken)).rejects.toThrow(StorageSchemaError);
    expect(getSetCalls()).toBe(0);
  });

  it('load migrates stored v0 data and persists the migration once', async () => {
    const { area, data, getSetCalls } = createFakeArea({
      [STORAGE_KEY]: { cycleConfig: validConfig },
    });
    const storage = createOmahiStorage(area);
    const expected = { schemaVersion: 1, cycleConfig: validConfig, periodLog: [] };
    expect(await storage.load()).toEqual(expected);
    expect(data[STORAGE_KEY]).toEqual(expected);
    expect(getSetCalls()).toBe(1);
    await storage.load();
    expect(getSetCalls()).toBe(1);
  });

  it('load surfaces corrupt stored data as a schema error', async () => {
    const { area } = createFakeArea({ [STORAGE_KEY]: 'corrupt' });
    await expect(createOmahiStorage(area).load()).rejects.toThrow(StorageSchemaError);
  });

  it('saveCycleConfig preserves the rest of the state', async () => {
    const { area } = createFakeArea({
      [STORAGE_KEY]: { schemaVersion: 1, cycleConfig: null, periodLog: [{ start: '2026-05-23' }] },
    });
    const storage = createOmahiStorage(area);
    const state = await storage.saveCycleConfig(validConfig);
    expect(state).toEqual({
      schemaVersion: 1,
      cycleConfig: validConfig,
      periodLog: [{ start: '2026-05-23' }],
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
});
