import { expect, seedOnboarded, STORAGE_KEY, test } from './fixtures';

test('new tab renders the glass dashboard, neutral by default', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  // Follicular day 9; seedOnboarded enables the new-tab override.
  await seedOnboarded(page, extensionId, { offsetDays: 8 });

  await page.goto(`chrome-extension://${extensionId}/newtab.html`);
  await expect(page.locator('[data-newtab="dashboard"]')).toBeVisible();
  await expect(page.locator('[data-newtab="clock"]')).toHaveText(/\d{1,2}[:.]\d{2}/);

  // Private by default: neutral coach copy only — the phase word and day
  // count must NOT be on the resting card.
  await expect(page.getByText('Fresh start')).toBeVisible();
  await expect(page.getByText('Ideas come easy now')).toBeVisible();
  await expect(page.getByText(/follicular/i)).toBeHidden();
  await expect(page.getByText('Day 9 of 28')).toBeHidden();

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

test('tap for detail reveals the cycle chip; a fresh tab starts collapsed again', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await seedOnboarded(page, extensionId, { offsetDays: 8 });

  await page.goto(`chrome-extension://${extensionId}/newtab.html`);
  const cardToggle = page.locator('[data-newtab="card-toggle"]');
  const detail = page.locator('[data-newtab="detail"]');
  await expect(detail).toBeHidden();

  // One intentional tap reveals the identifying detail…
  await cardToggle.click();
  await expect(detail).toBeVisible();
  await expect(detail.getByText('follicular')).toBeVisible();
  await expect(detail.getByText('Day 9 of 28')).toBeVisible();
  await expect(detail.getByText('Energy is climbing this week')).toBeVisible();

  // …a second tap hides it again.
  await cardToggle.click();
  await expect(detail).toBeHidden();

  // The reveal is per-tab and unpersisted: a fresh tab is neutral again.
  await cardToggle.click();
  await expect(detail).toBeVisible();
  const fresh = await context.newPage();
  await fresh.goto(`chrome-extension://${extensionId}/newtab.html`);
  await expect(fresh.locator('[data-newtab="dashboard"]')).toBeVisible();
  await expect(fresh.locator('[data-newtab="detail"]')).toBeHidden();
});

test('quiet mode collapses to clock only and persists across tabs', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await seedOnboarded(page, extensionId, { offsetDays: 8 });

  await page.goto(`chrome-extension://${extensionId}/newtab.html`);
  await expect(page.getByText('Fresh start')).toBeVisible();

  await page.locator('[data-newtab="quiet-toggle"]').click();
  await expect(page.locator('[data-newtab="quiet"]')).toBeVisible();
  await expect(page.locator('[data-newtab="clock"]')).toBeVisible();
  await expect(page.getByText('Your plan is hidden — tap Quiet to bring it back')).toBeVisible();
  await expect(page.getByText('Fresh start')).toBeHidden();

  // Quiet is stored: a tab opened mid-screen-share must come up quiet too.
  const during = await context.newPage();
  await during.goto(`chrome-extension://${extensionId}/newtab.html`);
  await expect(during.locator('[data-newtab="quiet"]')).toBeVisible();

  // Turning it back off restores the plan — live on the OTHER tab as well.
  await during.locator('[data-newtab="quiet-toggle"]').click();
  await expect(during.getByText('Fresh start')).toBeVisible();
  await expect(page.getByText('Fresh start')).toBeVisible();
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
