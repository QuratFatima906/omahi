/**
 * Playwright fixtures for MV3 extension testing, per the official guide:
 * https://playwright.dev/docs/chrome-extensions
 *
 * Loads the built extension (`pnpm build` must run first) in a persistent
 * context and derives the extension id from its service worker URL.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, chromium, type BrowserContext } from '@playwright/test';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const pathToExtension = path.join(dirname, '../apps/extension/.output/chrome-mv3');

if (!existsSync(pathToExtension)) {
  throw new Error(`Built extension not found at ${pathToExtension} — run \`pnpm build\` first.`);
}

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern -- Playwright fixture signature requires it
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2]!;
    await use(extensionId);
  },
});

export const expect = test.expect;
