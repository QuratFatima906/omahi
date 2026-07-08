import { browserToday, expect, STORAGE_KEY, test, toIso } from './fixtures';

/**
 * Chunk 10 store-readiness smoke: the full user journey in one sitting —
 * install → onboard → dashboard → calendar → log a period → undo → settings
 * → export → new tab. Every step is covered in depth by its own spec; this
 * one proves they chain.
 */
test('full journey: onboard → dashboard → calendar → log → settings → export → new tab', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  // Onboard: yesterday's date via the calendar, defaults elsewhere, new tab on.
  await page.getByRole('button', { name: "Let's begin" }).click();
  const today = await browserToday(page);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (yesterday.getMonth() !== today.getMonth()) {
    await page.getByRole('button', { name: 'Previous month' }).click();
  }
  await page.getByRole('button', { name: String(yesterday.getDate()), exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start planning' }).click();

  // Dashboard: cycle day 2 of the default 28/5 model.
  await expect(page.getByText('Menstruation · Day 2')).toBeVisible();

  // Calendar: today ringed, legend rendered.
  await page.getByRole('button', { name: 'Calendar' }).click();
  await expect(page.locator('[data-today="true"]')).toHaveCount(1);
  await expect(page.getByText('Predicted period', { exact: true })).toBeVisible();

  // Log today as a fresh period start → re-anchors to Day 1; then undo.
  await page.getByRole('button', { name: 'Log period start' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Menstruation · Day 1')).toBeVisible();
  await page.getByRole('button', { name: 'My period started' }).click();
  await page.getByRole('button', { name: 'Undo last entry' }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByText('Menstruation · Day 2')).toBeVisible();

  // Settings: export downloads a backup matching the stored state.
  await page.getByRole('button', { name: 'Settings' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup (JSON)' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`omahi-backup-${toIso(today)}.json`);

  const stored = await page.evaluate((key) => chrome.storage.local.get(key), STORAGE_KEY);
  expect(stored[STORAGE_KEY]).toMatchObject({
    schemaVersion: 3,
    cycleConfig: { anchorDate: toIso(yesterday), cycleLength: 28, periodLength: 5 },
    periodLog: [],
    settings: { newTabEnabled: true, quietMode: false },
  });

  // New tab: neutral title by default; the phase shows only after the reveal tap.
  await page.goto(`chrome-extension://${extensionId}/newtab.html`);
  await expect(page.getByText('Slow week')).toBeVisible();
  await page.locator('[data-newtab="card-toggle"]').click();
  await expect(page.locator('[data-newtab="detail"]').getByText('Day 2 of 28')).toBeVisible();
});
