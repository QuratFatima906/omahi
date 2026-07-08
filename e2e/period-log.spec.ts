import { expect, seedOnboarded, test } from './fixtures';

test('logging a period re-anchors the dashboard and calendar; undo restores', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  // Luteal day 21 today (28/5 anchored 20 days ago).
  await seedOnboarded(page, extensionId, { offsetDays: 20 });
  await expect(page.getByText('Luteal · Day 21')).toBeVisible();

  // Log a period starting today from the dashboard link.
  await page.getByRole('button', { name: 'My period started' }).click();
  await expect(page.getByRole('heading', { name: 'Log period' })).toBeVisible();
  // Today is preselected; just save.
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  // Predictions re-anchor: today becomes cycle day 1.
  await expect(page.getByText('Menstruation · Day 1')).toBeVisible();

  // The calendar agrees: today is a recorded (not predicted) period day.
  await page.getByRole('button', { name: 'Calendar' }).click();
  const todayCell = page.locator('[data-today="true"]');
  await expect(todayCell).toHaveAttribute('data-phase', 'menstruation');
  await expect(todayCell).not.toHaveAttribute('data-predicted', 'true');
  await page.getByRole('button', { name: 'Back to dashboard' }).click();

  // History shows the entry; undo restores the pre-log prediction.
  await page.getByRole('button', { name: 'My period started' }).click();
  await expect(page.getByText(/^Started /)).toBeVisible();
  await page.getByRole('button', { name: 'Undo last entry' }).click();
  await expect(page.getByText(/^Started /)).toBeHidden();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByText('Luteal · Day 21')).toBeVisible();
});

test('the same period start cannot be logged twice', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await seedOnboarded(page, extensionId, { offsetDays: 20 });

  await page.getByRole('button', { name: 'My period started' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Menstruation · Day 1')).toBeVisible();

  // Reopen the log view: today is preselected but already logged.
  await page.getByRole('button', { name: 'My period started' }).click();
  await expect(page.getByRole('alert')).toHaveText('That period start is already logged.');
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
});

test('the calendar CTA opens the log view too', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await seedOnboarded(page, extensionId, { offsetDays: 8 });

  await page.getByRole('button', { name: 'Calendar' }).click();
  await page.getByRole('button', { name: 'Log period start' }).click();
  await expect(page.getByRole('heading', { name: 'Log period' })).toBeVisible();
});
