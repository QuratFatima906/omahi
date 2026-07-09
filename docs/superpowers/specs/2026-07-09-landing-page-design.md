# Landing page (`apps/landing`) + shared glass library (`packages/ui`)

**Date:** 2026-07-09
**Status:** Approved

## Goal

Ship a public waitlist landing page at **omahi.app**, implementing the
"Omahi Waitlist - Glass" design (claude.ai design project
`e6d08d9b-c6ba-49bd-9a83-7f7a981085cf`), and extract the extension's glass
design system into a shared workspace package so both apps stay visually in
lockstep.

## Decisions

| Decision      | Choice                                                          |
| ------------- | --------------------------------------------------------------- |
| Approach      | Shared glass library (`packages/ui`) consumed by both apps      |
| Framework     | Vite + React 19 + TypeScript strict + Tailwind v4 (static site) |
| Waitlist dest | Substack (herhustlestack.substack.com): local validation, then open `/subscribe?email=<email>` in a new tab |
| Social proof  | Configurable count in `config.ts` ("Join N+ already on the list"), hand-edited |
| Deploy        | Cloudflare (git integration), custom domain omahi.app, Vite `base: '/'` |

## `packages/ui` — `@omahi/ui`

Raw-source workspace package, same pattern as `@omahi/core`
(`"exports"` point at `./src`, consumers compile it; no build step).

```
packages/ui/
  package.json          peerDeps: react; deps: @omahi/core (Phase type)
  tsconfig.json
  src/
    index.ts
    theme.css           fonts, @theme tokens, brand-gradient utilities,
                        focus ring, dark-mode override block
    glass-screen.tsx    moved verbatim from apps/extension/components/
    glass-card.tsx      NEW: GlassCard / GlassPanel primitives
                        (rgba-white bg + backdrop blur + hairline border recipe)
    phase-style.ts      moved verbatim from apps/extension/components/
  assets/fonts/         quicksand + nunito-sans latin woff2, vendored
                        (replaces @fontsource-variable deps; @font-face URLs
                        become package-relative, no node_modules paths)
```

### What moves vs. what stays in the extension

- **Moves:** design tokens (`@theme` block), font faces, brand-gradient
  utilities, focus-ring rule, dark-mode token overrides, `GlassScreen` +
  `ambient()`, `PHASE_STYLE`.
- **Stays:** popup sizing (`--popup-width/height`), `data-surface` rules,
  body/background wiring — in a slimmed `apps/extension/assets/extension.css`
  that does `@import '@omahi/ui/theme.css'` first.
- Extension changes are import-path updates only; no component rewrites.
- Tailwind v4 in each app must scan the package:
  `@source '../../packages/ui/src'` in the app CSS entry.

## `apps/landing` — `@omahi/landing`

```
apps/landing/
  package.json          dev / build / preview / test / typecheck
  vite.config.ts        react plugin, @tailwindcss/vite, base '/'
  index.html            meta/OG tags, favicon, title
  public/               favicon.svg + wordmark SVGs (from design project assets/)
  src/
    main.tsx
    app.tsx             section composition only
    landing.css         @import '@omahi/ui/theme.css'; @source ui package;
                        landing-only rules (ambient blobs, float keyframes)
    config.ts           waitlistCount, launchWindow, showSocialProof
    lib/waitlist.ts     validateEmail() + substackSubscribeUrl(); pure functions
    components/
      nav.tsx           sticky glass nav: wordmark, How it works / FAQ / Join
      hero.tsx          headline, pitch, WaitlistForm, glass product mockup
      waitlist-form.tsx email input + CTA; error / submitted states per design
      phase-cards.tsx   4 glass cards (menstruation/follicular/ovulation/luteal)
                        colored via PHASE_STYLE tokens
      features.tsx      4 numbered glass feature cards
      faq.tsx           accordion, one open at a time
      closing-cta.tsx   brand-gradient panel, "Love every phase."
      footer.tsx        wordmark + disclaimer line
```

### Behavior

- **Waitlist form:** validate email (same regex + copy as design mockup:
  empty → "Pop your email in first.", invalid → "That doesn't look like an
  email — mind checking?"). Valid → open
  `https://herhustlestack.substack.com/subscribe?email=<email>` in a new tab
  (Substack prefills the address; subscriber completes there — no API call,
  no CORS, no key). The card flips to an "Almost done" state: "Finish
  subscribing in the Substack tab we just opened — we'll email <email> when
  your phase is ready." A visible "Join waitlist" link still works with the
  new-tab blocked case (the state shows the URL as a fallback link).
- **FAQ:** five questions from the design, single-open accordion,
  `+` rotates 45° when open.
- **Social proof:** `Join {waitlistCount.toLocaleString()}+ already on the
  list · no spam, ever` from `config.ts`.
- All copy, palette, spacing, and layout taken from the design file,
  including footer disclaimer "Lifestyle guidance, not medical advice."
  (project hard rule: suggestions, not medical advice).
- Visual fidelity: hero product mockup is a static composition (local SVG
  ring, not the shared CycleRing) — YAGNI until proven shared-worthy.

## Repo integration

- Root scripts: add `dev:landing` / `build:landing`; existing `dev`/`build`
  keep pointing at the extension. `test` / `typecheck` / `lint` pick the new
  packages up via `pnpm -r --if-present`.
- `pnpm-workspace.yaml` already globs `apps/*` and `packages/*` — no change.

## Testing

- **Extraction regression net:** existing extension unit tests + Playwright
  e2e must pass unchanged after the `@omahi/ui` move.
- **Landing unit tests (Vitest):** `lib/waitlist.ts` — validation cases and
  subscribe-URL building (email encoding, odd characters).
- No landing e2e in v1 (one form + one accordion).

## Deploy (manual steps, documented in `apps/landing/README.md`)

Cloudflare git integration: root directory `apps/landing`, build command
`pnpm build`, output `dist`, then attach omahi.app in the Cloudflare
dashboard. No env vars needed.

## Out of scope

- Extension adoption of `GlassCard` (incremental, later).
- Mobile app links, analytics, cookie banners (none needed — no cookies).
- Backend/waitlist database.

## Open items

- Cloudflare project + domain attachment happen in the dashboard.
