import { expect, seedOnboarded, STORAGE_KEY, test } from './fixtures';

test('new tab renders the glass dashboard when enabled', async ({ context, extensionId }) => {
  const page = await context.newPage();
  // Follicular day 9; seedOnboarded enables the new-tab override.
  await seedOnboarded(page, extensionId, { offsetDays: 8 });

  await page.goto(`chrome-extension://${extensionId}/newtab.html`);
  await expect(page.locator('[data-newtab="dashboard"]')).toBeVisible();
  await expect(page.locator('[data-newtab="clock"]')).toHaveText(/\d{1,2}[:.]\d{2}/);
  await expect(page.getByText('Follicular · Day 9 of 28')).toBeVisible();
  await expect(page.getByText('Energy is climbing this week')).toBeVisible();

  // The gear opens the popup app as a dialog on the SAME tab (iframe overlay).
  const pagesBefore = context.pages().length;
  await page.locator('[aria-label="Open Omahi"]').click();
  const overlay = page.locator('[data-newtab="overlay"]');
  await expect(overlay).toBeVisible();
  await expect(overlay.locator('iframe')).toHaveAttribute('src', /popup\.html/);
  expect(context.pages().length).toBe(pagesBefore);

  // The embedded app is the real popup — its dashboard renders inside.
  const app = page.frameLocator('[data-newtab="overlay"] iframe');
  await expect(app.getByText('Big-idea energy')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();
});

test('chrome_url_overrides routes a fresh tab to the Omahi page', async ({
  context,
  extensionId,
}) => {
  const seedPage = await context.newPage();
  await seedOnboarded(seedPage, extensionId, { offsetDays: 8 });

  // Opening the browser's new-tab URL should land on the override.
  const tab = await context.newPage();
  await tab.goto('chrome://newtab/');
  await expect(tab.locator('[data-newtab="dashboard"]')).toBeVisible();
  expect(tab.url()).toContain(extensionId);
});

test('toggling off propagates LIVE to an already-open new tab', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await seedOnboarded(page, extensionId, { offsetDays: 8 });

  // Open the new tab first — it must react to the write without a reload.
  await page.goto(`chrome-extension://${extensionId}/newtab.html`);
  await expect(page.locator('[data-newtab="dashboard"]')).toBeVisible();

  await page.evaluate(async (key) => {
    const items = await chrome.storage.local.get(key);
    const state = items[key] as { settings: { newTabEnabled: boolean } };
    state.settings.newTabEnabled = false;
    await chrome.storage.local.set({ [key]: state });
  }, STORAGE_KEY);

  await expect(page.locator('[data-newtab="disabled"]')).toBeVisible();
  await expect(page.locator('[data-newtab="dashboard"]')).toBeHidden();
});

test('before onboarding, the new tab invites setup', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/newtab.html`);
  await expect(page.locator('[data-newtab="setup"]')).toBeVisible();
});
