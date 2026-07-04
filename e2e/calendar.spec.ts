import type { Page } from '@playwright/test';
import { expect, seedOnboarded, test } from './fixtures';

/**
 * Seed a state anchored on the 1st of the current month so the visible month
 * starts with a recorded period block: menstruation on days 1–5, next
 * predicted period starting day 29 (cycle length 28).
 */
async function seedMonthStart(page: Page, extensionId: string) {
  await seedOnboarded(page, extensionId, { dayOfMonth: 1 });
}

test('calendar opens from the dashboard, phases the month, and returns', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await seedMonthStart(page, extensionId);

  await page.getByRole('button', { name: 'Calendar' }).click();
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();

  // Recorded period block at the start of the month, phase-coded cells after.
  const day1 = page.locator('[data-iso$="-01"]');
  await expect(day1).toHaveAttribute('data-phase', 'menstruation');
  await expect(day1).not.toHaveAttribute('data-predicted', 'true');
  await expect(page.locator('[data-iso$="-20"]')).toHaveAttribute('data-phase', 'luteal');

  // Today is ringed exactly once.
  await expect(page.locator('[data-today="true"]')).toHaveCount(1);

  // Legend and the Chunk 7 entry point render.
  for (const label of ['Menstruation', 'Follicular', 'Ovulation', 'Luteal', 'Predicted period']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Log period start' })).toBeVisible();

  // Back returns to the dashboard.
  await page.getByRole('button', { name: 'Back to dashboard' }).click();
  await expect(page.getByText("Today's nudge")).toBeVisible();
});

test('month navigation reaches predicted period days', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await seedMonthStart(page, extensionId);

  await page.getByRole('button', { name: 'Calendar' }).click();
  const heading = page.getByRole('heading', { name: 'Calendar' });
  await expect(heading).toBeVisible();

  // The next predicted period starts on cycle day 29 — within this month or
  // the next. Checking both views deterministically finds dashed cells.
  const predicted = page.locator('[data-predicted="true"]');
  if ((await predicted.count()) === 0) {
    await page.getByRole('button', { name: 'Next month' }).click();
  }
  await expect(predicted.first()).toBeVisible();

  // Previous-month navigation also works (label changes away and back).
  await page.getByRole('button', { name: 'Previous month' }).click();
  await page.getByRole('button', { name: 'Previous month' }).click();
  await expect(page.locator('[data-today="true"]')).toHaveCount(0);
});
