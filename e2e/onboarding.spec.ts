import type { Page } from '@playwright/test';
import { expect, STORAGE_KEY, test } from './fixtures';

// Extension pages expose chrome.storage; the e2e tsconfig has no chrome types,
// so declare the minimal surface these evaluate() callbacks use.
declare const chrome: {
  storage: {
    local: {
      get(key: string): Promise<Record<string, unknown>>;
    };
  };
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** The 15th of last month — always in the past, so always selectable. */
function lastMonth15th(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 15);
}

async function openPopup(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.getByRole('heading', { name: 'omahi', exact: true })).toBeVisible();
}

async function readState(page: Page): Promise<unknown> {
  const items = await page.evaluate((key) => chrome.storage.local.get(key), STORAGE_KEY);
  return (items as Record<string, unknown>)[STORAGE_KEY];
}

test('happy path: onboarding writes config and reopening skips it', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await openPopup(page, extensionId);

  await page.getByRole('button', { name: "Let's begin" }).click();
  await expect(
    page.getByRole('heading', { name: 'When did your last period start?' }),
  ).toBeVisible();

  // Pick the 15th of last month — unambiguously in the past.
  await page.getByRole('button', { name: 'Previous month' }).click();
  await page.getByRole('button', { name: '15', exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(
    page.getByRole('heading', { name: 'How long is your cycle, usually?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Increase cycle length' }).click();
  await page.getByRole('button', { name: 'Increase cycle length' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(
    page.getByRole('heading', { name: 'And your period — how many days?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '6', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Omahi on every new tab' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('button', { name: 'Start planning' }).click();

  // Onboarding hands off to the (stub) dashboard.
  await expect(page.locator('main')).toHaveAttribute('data-onboarded', 'true');
  await expect(page.getByRole('heading', { name: "You're all set" })).toBeVisible();

  expect(await readState(page)).toEqual({
    schemaVersion: 2,
    cycleConfig: { anchorDate: toIso(lastMonth15th()), cycleLength: 30, periodLength: 6 },
    periodLog: [],
    settings: { newTabEnabled: true },
  });

  // Reopening the popup skips onboarding.
  await page.reload();
  await expect(page.locator('main')).toHaveAttribute('data-onboarded', 'true');
  await expect(page.getByRole('heading', { name: "You're all set" })).toBeVisible();
  await expect(page.getByRole('heading', { name: "Hi, I'm Omahi" })).toBeHidden();
});

test('error path: continuing without a date shows an error until a date is picked', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await openPopup(page, extensionId);

  await page.getByRole('button', { name: "Let's begin" }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toHaveText('Pick the day your last period started — or tap "Not sure".');
  // Still on step 1.
  await expect(
    page.getByRole('heading', { name: 'When did your last period start?' }),
  ).toBeVisible();

  // Picking a date clears the error and unblocks Continue.
  await page.getByRole('button', { name: 'Previous month' }).click();
  await page.getByRole('button', { name: '15', exact: true }).click();
  await expect(alert).toBeHidden();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(
    page.getByRole('heading', { name: 'How long is your cycle, usually?' }),
  ).toBeVisible();
});

test('error path: future days and future months are not reachable', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await openPopup(page, extensionId);

  await page.getByRole('button', { name: "Let's begin" }).click();

  // The calendar opens on the current month; there is never a later month to visit.
  await expect(page.getByRole('button', { name: 'Next month' })).toBeDisabled();

  // Tomorrow's cell (when this month has one) is disabled.
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (tomorrow.getMonth() === now.getMonth()) {
    await expect(
      page.getByRole('button', { name: String(tomorrow.getDate()), exact: true }),
    ).toBeDisabled();
  }
});

test('"Not sure" anchors to today; new-tab toggle can be declined', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await openPopup(page, extensionId);

  await page.getByRole('button', { name: "Let's begin" }).click();
  await page.getByRole('button', { name: 'Not sure' }).click();

  // Skips straight to step 2 with defaults.
  await expect(
    page.getByRole('heading', { name: 'How long is your cycle, usually?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('switch', { name: 'Omahi on every new tab' }).click();
  await page.getByRole('button', { name: 'Start planning' }).click();
  await expect(page.locator('main')).toHaveAttribute('data-onboarded', 'true');

  expect(await readState(page)).toEqual({
    schemaVersion: 2,
    cycleConfig: { anchorDate: toIso(new Date()), cycleLength: 28, periodLength: 5 },
    periodLog: [],
    settings: { newTabEnabled: false },
  });
});
