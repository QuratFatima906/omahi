import { expect, STORAGE_KEY, test } from './fixtures';

const config = { anchorDate: '2026-06-20', cycleLength: 28, periodLength: 5 };

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

test('popup runs the storage layer: migrates seeded v0 data and persists it', async ({
  context,
  extensionId,
}) => {
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;

  // Seed a pre-versioned (v0) state behind the app's back.
  const page = await context.newPage();
  await page.goto(popupUrl);
  await page.evaluate(
    ([key, cfg]) => chrome.storage.local.set({ [key as string]: { cycleConfig: cfg } }),
    [STORAGE_KEY, config] as const,
  );

  // On reload the popup's storage layer loads, migrates to v2, and persists
  // before rendering the data attributes.
  await page.reload();
  await expect(page.locator('main')).toHaveAttribute('data-storage', 'v2');
  await expect(page.locator('main')).toHaveAttribute('data-onboarded', 'true');
  const migrated = await page.evaluate((key) => chrome.storage.local.get(key), STORAGE_KEY);
  expect(migrated[STORAGE_KEY]).toEqual({
    schemaVersion: 2,
    cycleConfig: config,
    periodLog: [],
    settings: { newTabEnabled: false },
  });
  await page.close();

  // The migrated state persists into a fresh page.
  const freshPage = await context.newPage();
  await freshPage.goto(popupUrl);
  await expect(freshPage.locator('main')).toHaveAttribute('data-storage', 'v2');
  await expect(freshPage.locator('main')).toHaveAttribute('data-onboarded', 'true');
});
