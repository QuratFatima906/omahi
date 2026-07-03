import { expect, test } from './fixtures';

test('popup opens and renders Omahi', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  await expect(page.getByRole('heading', { name: 'Omahi' })).toBeVisible();
  // The popup imports @omahi/core, so this also proves the workspace wiring.
  await expect(page.locator('.core-check')).toHaveAttribute('data-core', 'omahi-core');
});
