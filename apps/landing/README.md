# @omahi/landing

Public waitlist landing page for [omahi.app](https://omahi.app). Static
Vite + React site; the waitlist itself lives on Substack (the form opens
`herhustlestack.substack.com/subscribe` with the email prefilled — no
backend, no env vars).

## Develop

```bash
pnpm dev:landing      # from repo root — Vite dev server
pnpm build:landing    # production build → apps/landing/dist
pnpm --filter @omahi/landing test   # waitlist lib unit tests
```

## Editing social proof

`src/config.ts` holds the hand-edited `waitlistCount` ("Join N+ already on
the list"), the `launchWindow` shown in the FAQ, and `showSocialProof` to
hide the count entirely.

## Deploy (Cloudflare, manual dashboard steps)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to
   Git** and select this repository.
2. Build configuration:
   - **Root directory:** `apps/landing`
   - **Build command:** `pnpm build`
   - **Build output directory:** `dist`
3. No environment variables needed.
4. After the first deploy: **Custom domains → Set up a custom domain →
   `omahi.app`** (Cloudflare manages DNS + certificate).

Pushes to `main` redeploy automatically via the git integration.
