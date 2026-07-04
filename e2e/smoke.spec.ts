import { expect, test } from './fixtures';

test('popup opens and renders the Omahi welcome screen', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  // Fresh profile → first-run onboarding welcome.
  await expect(page.getByRole('heading', { name: 'omahi', exact: true })).toBeVisible();
  // The popup imports @omahi/core, so this also proves the workspace wiring.
  await expect(page.locator('main')).toHaveAttribute(
    'data-core',
    'menstruation follicular ovulation luteal',
  );
});
