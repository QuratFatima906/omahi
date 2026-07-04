/**
 * Minimal chrome.storage surface available inside extension pages, for
 * page.evaluate() callbacks. The e2e tsconfig deliberately has no full chrome
 * types — specs should only touch this narrow API.
 */
declare const chrome: {
  storage: {
    local: {
      get(key: string): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
    };
  };
};
