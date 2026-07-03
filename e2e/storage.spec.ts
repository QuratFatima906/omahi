import { expect, test } from './fixtures';

/** Matches OmahiState / STORAGE_KEY in apps/extension/lib/storage.ts. */
const STORAGE_KEY = 'omahi';
const seededState = {
  schemaVersion: 1,
  cycleConfig: { anchorDate: '2026-06-20', cycleLength: 28, periodLength: 5 },
  periodLog: [{ start: '2026-06-20' }],
};

// Extension pages expose chrome.storage; the e2e tsconfig has no chrome types,
// so declare the minimal surface these evaluate() callbacks use.
declare const chrome: {
  storage: {
    local: {
      set(items: Record<string, unknown>): Promise<void>;
      get(key: string): Promise<Record<string, unknown>>;
    };
  };
};

test('state set via chrome.storage.local survives reload and fresh pages', async ({
  context,
  extensionId,
}) => {
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;

  const page = await context.newPage();
  await page.goto(popupUrl);
  await page.evaluate(([key, state]) => chrome.storage.local.set({ [key as string]: state }), [
    STORAGE_KEY,
    seededState,
  ] as const);

  await page.reload();
  const afterReload = await page.evaluate((key) => chrome.storage.local.get(key), STORAGE_KEY);
  expect(afterReload[STORAGE_KEY]).toEqual(seededState);
  await page.close();

  const freshPage = await context.newPage();
  await freshPage.goto(popupUrl);
  const afterFreshPage = await freshPage.evaluate(
    (key) => chrome.storage.local.get(key),
    STORAGE_KEY,
  );
  expect(afterFreshPage[STORAGE_KEY]).toEqual(seededState);
});
