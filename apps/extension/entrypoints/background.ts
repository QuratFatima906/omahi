export default defineBackground(() => {
  // Must exist even while empty: e2e fixtures derive the extension id from
  // this service worker (e2e/fixtures.ts).
});
