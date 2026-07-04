import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { Page } from '@playwright/test';
import { expect, seedOnboarded, STORAGE_KEY, test } from './fixtures';

async function openSettings(page: Page, extensionId: string) {
  await seedOnboarded(page, extensionId, { offsetDays: 8 });
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
}

async function readState(page: Page): Promise<Record<string, unknown>> {
  const items = await page.evaluate((key) => chrome.storage.local.get(key), STORAGE_KEY);
  return items[STORAGE_KEY] as Record<string, unknown>;
}

test('cycle config edits persist across reloads', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await openSettings(page, extensionId);

  await expect(page.getByText('28 days')).toBeVisible();
  await page.getByRole('button', { name: 'Increase cycle length' }).click();
  await expect(page.getByText('29 days')).toBeVisible();
  await page.getByRole('button', { name: 'Decrease period length' }).click();
  await expect(page.getByText('4 days')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByText('29 days')).toBeVisible();
  await expect(page.getByText('4 days')).toBeVisible();

  const state = await readState(page);
  expect(state.cycleConfig).toMatchObject({ cycleLength: 29, periodLength: 4 });
});

test('new-tab toggle flips and persists', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await openSettings(page, extensionId);

  const toggle = page.getByRole('switch', { name: 'Show Omahi on every new tab' });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');

  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('switch', { name: 'Show Omahi on every new tab' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
});

test('editing the anchor date re-anchors and shows in the row', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await openSettings(page, extensionId);

  const anchorRow = page.getByRole('button', { name: 'Last period started' });
  await anchorRow.click();
  // Pick the 10th of the previous month — always in the past.
  await page.getByRole('button', { name: 'Previous month' }).click();
  await page.getByRole('button', { name: '10', exact: true }).click();

  await expect(anchorRow).toContainText(/10, \d{4}/);
});

test('full backup round-trip: export → delete all → re-onboard → import restores', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await openSettings(page, extensionId);
  const original = await readState(page);

  // Export downloads a JSON snapshot.
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup (JSON)' }).click();
  const download = await downloadPromise;
  const backupPath = path.join(
    await fs.mkdtemp(path.join(os.tmpdir(), 'omahi-e2e-')),
    'backup.json',
  );
  await download.saveAs(backupPath);
  expect(JSON.parse(await fs.readFile(backupPath, 'utf8'))).toEqual(original);

  // Delete everything (two-tap confirm) → back to onboarding.
  await page.getByRole('button', { name: 'Delete all data…' }).click();
  await page.getByRole('button', { name: 'Tap again to delete everything' }).click();
  await expect(page.getByRole('heading', { name: "Hi, I'm Omahi" })).toBeVisible();
  expect(await readState(page)).toMatchObject({ cycleConfig: null, periodLog: [] });

  // Re-onboard minimally to reach settings again.
  await page.getByRole('button', { name: "Let's begin" }).click();
  await page.getByRole('button', { name: 'Not sure' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start planning' }).click();
  await expect(page.getByText("Today's nudge")).toBeVisible();

  // Import the backup — state fully restored.
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Import backup file').setInputFiles(backupPath);
  await expect(page.getByRole('status')).toHaveText('Backup restored.');
  expect(await readState(page)).toEqual(original);
});

test('import rejects a malformed file with an inline error', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await openSettings(page, extensionId);
  const before = await readState(page);

  await page.getByLabel('Import backup file').setInputFiles({
    name: 'junk.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"schemaVersion": 99}'),
  });
  await expect(page.getByRole('status')).toContainText("isn't a valid Omahi backup");
  expect(await readState(page)).toEqual(before);
});
