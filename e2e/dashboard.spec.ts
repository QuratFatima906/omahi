import type { Page } from '@playwright/test';
import { expect, seedOnboarded, test } from './fixtures';

/** Seed a completed-onboarding state anchored `offsetDays` ago, then reload. */
async function seedAnchor(page: Page, extensionId: string, offsetDays: number) {
  await seedOnboarded(page, extensionId, { offsetDays });
}

// Anchor offsets place "today" at a known cycle day for the 28/5 model:
// day 2 → menstruation, day 9 → follicular, day 14 → ovulation, day 21 → luteal.

test('menstruation day: phase card, focus rows, and nudge render', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await seedAnchor(page, extensionId, 1);

  await expect(page.getByText('Menstruation · Day 2')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rest is productive' })).toBeVisible();
  await expect(page.getByText('Still low-power mode — shortlists, not marathons.')).toBeVisible();
  await expect(page.getByText('Cozy, warm meals; keep it gentle.')).toBeVisible();
  await expect(page.getByText('Gentle only — walks, stretching, slow flows.')).toBeVisible();
  await expect(page.getByText('High rest; guard your evenings.')).toBeVisible();
  await expect(page.getByText('Follicular begins in 4 days')).toBeVisible();
  await expect(page.getByText("Today's nudge")).toBeVisible();
  await expect(page.getByRole('button', { name: 'My period started' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Calendar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
});

test('follicular day: clamped day-variant content and next-phase line', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await seedAnchor(page, extensionId, 8);

  await expect(page.getByText('Follicular · Day 9')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Big-idea energy' })).toBeVisible();
  await expect(page.getByText('Momentum is real now — block a deep-work morning.')).toBeVisible();
  await expect(page.getByText('Ovulation window opens in 4 days')).toBeVisible();
});

test('ovulation day: peak content renders', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await seedAnchor(page, extensionId, 13);

  await expect(page.getByText('Ovulation · Day 14')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your spotlight week' })).toBeVisible();
  await expect(page.getByText('Peak-day energy: the pitch, the ask, the talk.')).toBeVisible();
  await expect(page.getByText('Luteal begins in 2 days')).toBeVisible();
});

test('luteal day: wind-down content and period prediction', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await seedAnchor(page, extensionId, 20);

  await expect(page.getByText('Luteal · Day 21')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cozy focus' })).toBeVisible();
  await expect(page.getByText('Start declining the late things.')).toBeVisible();
  await expect(page.getByText('Next period predicted in 8 days')).toBeVisible();
});
