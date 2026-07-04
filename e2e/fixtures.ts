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
import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const pathToExtension = path.join(dirname, '../apps/extension/.output/chrome-mv3');

/** Matches STORAGE_KEY in apps/extension/lib/storage.ts. */
export const STORAGE_KEY = 'omahi';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** A Date's local calendar day as `YYYY-MM-DD` (how the app formats dates). */
export function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * The page's own "today" as a local Date. Date expectations must come from
 * the browser clock the app reads, not the test process's — otherwise a test
 * spanning local midnight asserts against the wrong day.
 */
export async function browserToday(page: Page): Promise<Date> {
  const [year, month, day] = await page.evaluate(() => {
    const now = new Date();
    return [now.getFullYear(), now.getMonth(), now.getDate()] as const;
  });
  return new Date(year, month, day);
}

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
