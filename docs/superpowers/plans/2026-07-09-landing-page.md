# Landing Page + Shared Glass Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the public waitlist landing page (`apps/landing`, deployed to omahi.app) and extract the extension's glass design system into a shared `packages/ui` workspace package consumed by both apps.

**Architecture:** `@omahi/ui` is a raw-source workspace package (same pattern as `@omahi/core`: `exports` point at `./src`, consumers compile it, no build step) holding the design tokens (`theme.css`), vendored fonts, and glass components. The extension is rewired to import from it (import-path changes only). The landing app is a static Vite + React site composed of section components, with a pure-function waitlist lib (validated email → open Substack subscribe URL in a new tab).

**Tech Stack:** React 19, TypeScript strict, Tailwind CSS v4 (`@tailwindcss/vite`), Vite 7, Vitest, pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-07-09-landing-page-design.md`
**Design source:** claude.ai design project `e6d08d9b-c6ba-49bd-9a83-7f7a981085cf`, file `Omahi Waitlist - Glass.dc.html`. All copy and colors in this plan were transcribed from that file — treat the strings in this plan as canonical.

## Global Constraints

- **Waitlist destination (exact):** `https://herhustlestack.substack.com/subscribe?email=<url-encoded email>` opened in a new tab. No API call, no backend.
- **Validation copy (exact):** empty → `Pop your email in first.` · invalid → `That doesn't look like an email — mind checking?`
- **Email regex (from design):** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` applied to the trimmed value.
- **Footer disclaimer (exact, project hard rule):** `Lifestyle guidance, not medical advice. © 2026 Omahi.`
- **Versions:** `react ^19.2.4`, `tailwindcss ^4.3.2`, `typescript ^5.9.3`, `vitest ^3.2.4`. TS strict comes from `tsconfig.base.json` — every new tsconfig extends it.
- **Naming:** `camelCase` functions, `PascalCase` components, `kebab-case` files.
- **Commits:** Conventional Commits. **Never add `Co-Authored-By` or any AI-attribution footer** (repo rule).
- **`packages/ui` is raw-source:** no build step; `package.json` `exports` point at `./src/*`.
- **Fonts:** latin-subset woff2 only, vendored into `packages/ui/assets/fonts/` (English-only v1).
- **Landing is light-only:** `<html data-theme="light">` opts out of the shared dark-mode tokens (see Task 1).
- **Before every commit:** run `pnpm format` so `format:check` in CI stays green.
- Work happens on the existing `feat/landing-page` branch. One PR for the whole plan.

## File Structure (end state)

```
packages/ui/
  package.json               @omahi/ui — raw-source, exports ./src
  tsconfig.json
  assets/fonts/              quicksand + nunito-sans latin woff2 (vendored)
  src/
    index.ts                 public exports
    theme.css                fonts, @theme tokens, gradients, focus ring, dark overrides
    glass-screen.tsx         moved verbatim from apps/extension/components/
    glass-card.tsx           NEW GlassCard / GlassPanel primitives
    phase-style.ts           moved verbatim from apps/extension/components/
apps/extension/
  assets/extension.css       NEW slim css: @import '@omahi/ui/theme.css' + surface rules
  assets/theme.css           DELETED
  components/glass-screen.tsx  DELETED (moved)
  components/phase-style.ts    DELETED (moved)
apps/landing/
  package.json               @omahi/landing
  vite.config.ts / vitest.config.ts / tsconfig.json
  index.html                 meta/OG tags, favicon, data-theme="light"
  README.md                  Cloudflare deploy steps
  public/                    favicon.svg + wordmark SVGs
  src/
    main.tsx
    app.tsx                  section composition only
    landing.css              theme import, @source, body, float keyframes
    config.ts                waitlistCount / launchWindow / showSocialProof
    lib/waitlist.ts          validateEmail() + substackSubscribeUrl()
    components/              nav, hero, waitlist-form, phase-cards, features,
                             faq, closing-cta, footer (one file each)
  tests/waitlist.test.ts
```

---

### Task 1: Create `packages/ui` (tokens, fonts, moved components)

Creates the package with **copies** of the extension files (originals stay put until Task 2), so the extension keeps working and this task is independently reviewable.

**Files:**

- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/theme.css`
- Create: `packages/ui/src/glass-screen.tsx` (copy of `apps/extension/components/glass-screen.tsx`)
- Create: `packages/ui/src/phase-style.ts` (copy of `apps/extension/components/phase-style.ts`)
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/assets/fonts/quicksand-latin-wght-normal.woff2` (vendored copy)
- Create: `packages/ui/assets/fonts/nunito-sans-latin-wght-normal.woff2` (vendored copy)

**Interfaces:**

- Consumes: `Phase` type from `@omahi/core` (in `phase-style.ts`).
- Produces (used by Tasks 2, 3, 6–8):
  - `import { GlassScreen, ambient, PHASE_STYLE } from '@omahi/ui'`
    - `ambient(color: string, percent: number): string`
    - `GlassScreen({ glow: [string, string], children: ReactNode })`
    - `PHASE_STYLE: Record<Phase, { color: string; tint: string; deep: string }>`
  - `@import '@omahi/ui/theme.css'` (CSS export)

- [ ] **Step 1: Vendor the font files**

```bash
mkdir -p packages/ui/assets/fonts packages/ui/src
cp apps/extension/node_modules/@fontsource-variable/quicksand/files/quicksand-latin-wght-normal.woff2 packages/ui/assets/fonts/
cp apps/extension/node_modules/@fontsource-variable/nunito-sans/files/nunito-sans-latin-wght-normal.woff2 packages/ui/assets/fonts/
ls packages/ui/assets/fonts
```

Expected: both `.woff2` files listed.

- [ ] **Step 2: Write `packages/ui/package.json`**

```json
{
  "name": "@omahi/ui",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./theme.css": "./src/theme.css"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^19.2.4"
  },
  "dependencies": {
    "@omahi/core": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^19.2.14",
    "react": "^19.2.4",
    "typescript": "^5.9.3"
  }
}
```

- [ ] **Step 3: Write `packages/ui/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM"],
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Write `packages/ui/src/theme.css`**

This is the shared portion of `apps/extension/assets/theme.css`, with three deliberate changes:

1. Font URLs point at the vendored files (package-relative), not `node_modules`.
2. The `body` rule and the `data-surface` / popup-sizing rules are **omitted** (they stay extension-side, Task 2).
3. The dark-mode block's selector becomes `:root:not([data-theme='light'])` so the light-only landing page can opt out by stamping `data-theme="light"` on `<html>`. The extension never sets `data-theme`, so its behavior is unchanged.

```css
/**
 * Omahi design tokens — Phase colors pair with their tints; the brand
 * gradient runs coral → rose. Shared by the extension and the landing page.
 */
@import 'tailwindcss';

/*
 * Fonts: latin subsets only (English-only v1), vendored into this package so
 * consumers don't need @fontsource deps. Declarations mirror the
 * @fontsource-variable latin @font-face blocks.
 */
@font-face {
  font-family: 'Quicksand Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 300 700;
  src: url('../assets/fonts/quicksand-latin-wght-normal.woff2') format('woff2-variations');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
    U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Nunito Sans Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 200 1000;
  src: url('../assets/fonts/nunito-sans-latin-wght-normal.woff2') format('woff2-variations');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329,
    U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@theme {
  --font-display: 'Quicksand Variable', 'Quicksand', sans-serif;
  --font-sans: 'Nunito Sans Variable', 'Nunito Sans', sans-serif;

  --color-coral: #ff7e5f;
  --color-rose: #d64570;
  /* Light accent used on gradient backgrounds (taglines, header icons). */
  --color-blush: #ffe3d6;

  --color-surface: #fbf5f1;
  --color-card: #ffffff;
  --color-line: #f0e2dc;
  --color-hairline: #f8eee9;

  /* Barely-tinted warm field the glass popup/onboarding screens float over. */
  --color-field: #f1e7e1;

  /* Frosted glass surfaces: `glass` for hero panels, `glass-soft` for rows
     and list groups, one shared edge color. */
  --color-glass: rgba(255, 255, 255, 0.55);
  --color-glass-soft: rgba(255, 255, 255, 0.5);
  --color-glass-border: rgba(255, 255, 255, 0.7);

  /* Destructive actions (delete all data). */
  --color-danger: #c0574f;

  --color-ink: #2e2226;
  --color-ink-soft: #6e5560;
  --color-ink-muted: #8a7078;
  --color-ink-faint: #b08d96;
  --color-ink-ghost: #c9aeb6;
  /* Adjacent-month / disabled day numbers. */
  --color-ink-disabled: #d9c8c1;

  /* `deep` = text-on-tint variant; aliases the base where it's already dark
     enough. Tints are translucent washes so the ambient field glows through
     the glass panels they sit on. */
  --color-menstruation: #c74b6b;
  --color-menstruation-tint: rgba(199, 75, 107, 0.2);
  --color-menstruation-deep: #b33f60;
  --color-follicular: #e8875b;
  --color-follicular-tint: rgba(232, 135, 91, 0.22);
  --color-follicular-deep: #b85f33;
  --color-ovulation: #e3a94a;
  --color-ovulation-tint: rgba(227, 169, 74, 0.28);
  --color-ovulation-deep: #a87422;
  --color-luteal: #96588c;
  --color-luteal-tint: rgba(150, 88, 140, 0.2);
  --color-luteal-deep: #8a4e80;
}

@utility bg-brand-gradient {
  background-image: linear-gradient(135deg, var(--color-coral) 0%, var(--color-rose) 100%);
}

/* Onboarding welcome field — the one screen that keeps a full brand wash. */
:root {
  --welcome-gradient: linear-gradient(165deg, #ff8264 0%, #e45a7e 55%, #c94e86 100%);
}

@utility bg-welcome-gradient {
  background-image: var(--welcome-gradient);
}

@utility text-brand-gradient {
  background-image: linear-gradient(135deg, var(--color-coral) 0%, var(--color-rose) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

/* Keyboard navigation: one visible, brand-colored focus ring everywhere. */
:focus-visible {
  outline: 2px solid var(--color-rose);
  outline-offset: 2px;
}

/*
 * Dark theme. Utilities resolve var(--color-*) at use sites, so overriding
 * the tokens on the root flips every screen. A light-only surface (the
 * landing page) opts out by stamping data-theme="light" on <html>.
 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-coral: #ff9b7e;
    --color-rose: #ed6b94;
    --color-surface: #1d1519;
    --color-card: #2a1f26;
    --color-line: #40323a;
    --color-hairline: #352a30;
    --color-field: #1b1620;
    --color-glass: rgba(255, 255, 255, 0.07);
    --color-glass-soft: rgba(255, 255, 255, 0.05);
    --color-glass-border: rgba(255, 255, 255, 0.12);
    --color-danger: #e88a82;
    --color-ink: #f8eee9;
    --color-ink-soft: #a88d96;
    --color-ink-muted: #a88d96;
    --color-ink-faint: #8a7078;
    --color-ink-ghost: #6e5560;
    --color-ink-disabled: #574750;
    /* Dark tints run heavier so the wash reads over the near-black field;
       deeps flip to pastels that stay legible as text on those washes. */
    --color-menstruation: #e76d8e;
    --color-menstruation-tint: rgba(199, 75, 107, 0.32);
    --color-menstruation-deep: #f1a9bc;
    --color-follicular: #f09f73;
    --color-follicular-tint: rgba(232, 135, 91, 0.32);
    --color-follicular-deep: #f4b48f;
    --color-ovulation: #edbe66;
    --color-ovulation-tint: rgba(227, 169, 74, 0.34);
    --color-ovulation-deep: #eac77e;
    --color-luteal: #b07aa8;
    --color-luteal-tint: rgba(176, 122, 168, 0.3);
    --color-luteal-deep: #d4aecc;
    --welcome-gradient: linear-gradient(165deg, #6e2e3e 0%, #4a2444 60%, #331c34 100%);
  }
}
```

- [ ] **Step 5: Copy the two components verbatim**

```bash
cp apps/extension/components/glass-screen.tsx packages/ui/src/glass-screen.tsx
cp apps/extension/components/phase-style.ts packages/ui/src/phase-style.ts
```

Do NOT edit their contents — `phase-style.ts` already imports `Phase` from `@omahi/core`, which is now a dependency of this package.

- [ ] **Step 6: Write `packages/ui/src/index.ts`**

```ts
export { GlassScreen, ambient } from './glass-screen';
export { PHASE_STYLE } from './phase-style';
```

- [ ] **Step 7: Install and typecheck**

```bash
pnpm install
pnpm --filter @omahi/ui typecheck
```

Expected: install links the new workspace package; typecheck exits 0.

- [ ] **Step 8: Verify nothing broke (extension untouched)**

```bash
pnpm test && pnpm build
```

Expected: all existing unit tests pass; extension builds.

- [ ] **Step 9: Format and commit**

```bash
pnpm format
git add packages/ui pnpm-lock.yaml
git commit -m "feat(ui): extract glass design system into @omahi/ui"
```

---

### Task 2: Rewire the extension onto `@omahi/ui`

Import-path updates only — no component rewrites. Deletes the now-duplicated originals.

**Files:**

- Create: `apps/extension/assets/extension.css`
- Delete: `apps/extension/assets/theme.css`
- Delete: `apps/extension/components/glass-screen.tsx`
- Delete: `apps/extension/components/phase-style.ts`
- Modify: `apps/extension/package.json` (deps)
- Modify: `apps/extension/entrypoints/popup/main.tsx:3`
- Modify: `apps/extension/entrypoints/newtab/main.tsx:3`
- Modify: `apps/extension/components/dashboard/dashboard.tsx:4-6`
- Modify: `apps/extension/components/settings/settings-view.tsx:17-19`
- Modify: `apps/extension/components/calendar/phase-calendar.tsx:5-7`
- Modify: `apps/extension/components/period-log/period-log-view.tsx:5-7`
- Modify: `apps/extension/components/onboarding/step-shell.tsx:2`
- Modify: `apps/extension/entrypoints/newtab/app.tsx:6`

**Interfaces:**

- Consumes: `@omahi/ui` exports and `@omahi/ui/theme.css` from Task 1.
- Produces: nothing new — behavior must be identical (regression-tested).

- [ ] **Step 1: Write `apps/extension/assets/extension.css`**

The extension-only remainder of the old `theme.css` (body wiring, `data-surface` rules, popup sizing), importing the shared theme first. The `@source` line makes Tailwind scan the ui package for class names used by `GlassScreen` (e.g. `bg-field`, `blur-[58px]`).

```css
/* Extension-only surface wiring; all shared tokens come from @omahi/ui. */
@import '@omahi/ui/theme.css';
@source '../../../packages/ui/src';

body {
  margin: 0;
  font-family: var(--font-sans);
  color: var(--color-ink);
  -webkit-font-smoothing: antialiased;
}

/*
 * Page surfaces: `data-surface` is stamped on <html> before React renders,
 * so the background (and, in dark mode, every token) paints with the
 * stylesheet — no white flash and no white overscroll edges.
 */
html[data-surface='newtab'],
html[data-surface='newtab'] body {
  background: var(--color-surface);
}

/*
 * Chrome sizes an action popup to the document's intrinsic size (capped at
 * 800×600), so the popup's natural size must be declared somewhere — this
 * variable pair is that single place. Every layout inside tracks the live
 * viewport (dvh/dvw, flex, percentages), never these numbers, so zoomed
 * popups and full-tab views reflow instead of clipping.
 */
:root {
  --popup-width: 380px;
  --popup-height: 560px;
}

html[data-surface='popup'],
html[data-surface='popup'] body {
  width: var(--popup-width);
  height: var(--popup-height);
  overflow: hidden;
  background: var(--color-field);
}

/* Opened as a regular tab (any viewport wider than the popup): fill it. */
@media (min-width: 480px) {
  html[data-surface='popup'],
  html[data-surface='popup'] body {
    width: 100%;
    height: 100%;
  }
}
```

- [ ] **Step 2: Update the two CSS entry imports**

In `apps/extension/entrypoints/popup/main.tsx` and `apps/extension/entrypoints/newtab/main.tsx`, change:

```ts
import '../../assets/theme.css';
```

to:

```ts
import '../../assets/extension.css';
```

- [ ] **Step 3: Update component imports**

In each file, replace the relative glass-screen / phase-style imports with a single `@omahi/ui` import (keep all other imports untouched):

`apps/extension/components/dashboard/dashboard.tsx`, `apps/extension/components/settings/settings-view.tsx`, `apps/extension/components/calendar/phase-calendar.tsx`, `apps/extension/components/period-log/period-log-view.tsx` — replace the two lines

```ts
import { ambient, GlassScreen } from '../glass-screen';
import { PHASE_STYLE } from '../phase-style';
```

with

```ts
import { ambient, GlassScreen, PHASE_STYLE } from '@omahi/ui';
```

(Note: in these files the two old imports are NOT adjacent — there is another import between them. Replace each line individually, keeping the line between.)

`apps/extension/components/onboarding/step-shell.tsx` — replace

```ts
import { ambient, GlassScreen } from '../glass-screen';
```

with

```ts
import { ambient, GlassScreen } from '@omahi/ui';
```

`apps/extension/entrypoints/newtab/app.tsx` — replace

```ts
import { PHASE_STYLE } from '../../components/phase-style';
```

with

```ts
import { PHASE_STYLE } from '@omahi/ui';
```

- [ ] **Step 4: Check nothing else references the moved files**

```bash
grep -rn "glass-screen\|phase-style\|assets/theme.css" apps/extension --include="*.ts" --include="*.tsx" --include="*.css" | grep -v node_modules | grep -v ".wxt"
```

Expected: no output. If any test file imports them, update it to `@omahi/ui` the same way.

- [ ] **Step 5: Delete the moved originals**

```bash
git rm apps/extension/assets/theme.css apps/extension/components/glass-screen.tsx apps/extension/components/phase-style.ts
```

- [ ] **Step 6: Update `apps/extension/package.json` dependencies**

Remove the two `@fontsource-variable/*` entries; add `@omahi/ui`. The dependencies block becomes:

```json
  "dependencies": {
    "@omahi/core": "workspace:*",
    "@omahi/ui": "workspace:*",
    "@tailwindcss/vite": "^4.3.2",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "tailwindcss": "^4.3.2"
  },
```

Then:

```bash
pnpm install
```

- [ ] **Step 7: Full regression — unit, typecheck, build, e2e**

```bash
pnpm test && pnpm typecheck && pnpm build && pnpm e2e
```

Expected: everything green. The e2e suite loads the built extension, so it catches font/CSS regressions too. If e2e fails on visuals, compare the built CSS: fonts must load from the bundled woff2 assets (search `dist`/`.output` for `woff2`), and `bg-field`/glass classes must exist in the output CSS (proves `@source` worked).

- [ ] **Step 8: Format and commit**

```bash
pnpm format
git add -A
git commit -m "refactor(extension): consume @omahi/ui for tokens and glass components"
```

---

### Task 3: `GlassCard` / `GlassPanel` primitives

**Files:**

- Create: `packages/ui/src/glass-card.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**

- Produces (used by Tasks 6–8):
  - `GlassCard({ className?, style?, children })` — hero-level frosted card: `rounded-[22px]`, `bg-glass`, hairline border, strong blur.
  - `GlassPanel({ className?, style?, children })` — softer row surface: `rounded-[14px]`, `bg-glass-soft`, lighter blur.
  - Both merge `className` after the base classes, so callers can override (e.g. `bg-white/40`, padding, shadows).

- [ ] **Step 1: Write `packages/ui/src/glass-card.tsx`**

```tsx
import type { CSSProperties, ReactNode } from 'react';

interface GlassProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Frosted-glass card recipe from the Omahi glass design: translucent white
 * wash over the ambient field, heavy blur + saturation boost, one hairline
 * highlight border. `GlassCard` is the hero-panel weight; `GlassPanel` is
 * the softer weight for rows and list groups.
 */
export function GlassCard({ className = '', style, children }: GlassProps) {
  return (
    <div
      className={`rounded-[22px] border border-glass-border bg-glass backdrop-blur-[24px] backdrop-saturate-[1.7] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function GlassPanel({ className = '', style, children }: GlassProps) {
  return (
    <div
      className={`rounded-[14px] border border-glass-border bg-glass-soft backdrop-blur-[18px] backdrop-saturate-150 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Add to `packages/ui/src/index.ts`**

```ts
export { GlassScreen, ambient } from './glass-screen';
export { GlassCard, GlassPanel } from './glass-card';
export { PHASE_STYLE } from './phase-style';
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @omahi/ui typecheck
```

Expected: exit 0.

- [ ] **Step 4: Format and commit**

```bash
pnpm format
git add packages/ui
git commit -m "feat(ui): add GlassCard and GlassPanel primitives"
```

---

### Task 4: Scaffold `apps/landing`

Empty-but-running landing shell: Vite app boots, theme loads, root scripts wired.

**Files:**

- Create: `apps/landing/package.json`
- Create: `apps/landing/vite.config.ts`
- Create: `apps/landing/vitest.config.ts`
- Create: `apps/landing/tsconfig.json`
- Create: `apps/landing/index.html`
- Create: `apps/landing/public/favicon.svg` (copy)
- Create: `apps/landing/public/omahi-wordmark-gradient.svg` (copy)
- Create: `apps/landing/public/omahi-wordmark-white.svg` (copy)
- Create: `apps/landing/src/main.tsx`
- Create: `apps/landing/src/app.tsx`
- Create: `apps/landing/src/landing.css`
- Create: `apps/landing/src/config.ts`
- Modify: root `package.json` (scripts)

**Interfaces:**

- Consumes: `@omahi/ui/theme.css` (Task 1).
- Produces (used by Tasks 5–10):
  - `config: { waitlistCount: number; showSocialProof: boolean; launchWindow: string }` from `src/config.ts`.
  - `app.tsx` section slots — later tasks add one `<Section />` each.
  - The `animate-float` utility (defined via `@theme` in `landing.css`).

- [ ] **Step 1: Write `apps/landing/package.json`**

```json
{
  "name": "@omahi/landing",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run --coverage",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@omahi/ui": "workspace:*",
    "@tailwindcss/vite": "^4.3.2",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "tailwindcss": "^4.3.2"
  },
  "devDependencies": {
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.0.0",
    "@vitest/coverage-v8": "^3.2.6",
    "typescript": "^5.9.3",
    "vite": "^7.0.0",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Write `apps/landing/vite.config.ts`**

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
});
```

- [ ] **Step 3: Write `apps/landing/vitest.config.ts`** (mirrors the repo's 100%-coverage convention, scoped to the pure lib)

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
    },
  },
});
```

- [ ] **Step 4: Write `apps/landing/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "types": ["vite/client"]
  },
  "include": ["src", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 5: Write `apps/landing/index.html`**

`data-theme="light"` is what pins the shared tokens to their light values (see Task 1 Step 4).

```html
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Omahi — plan with your cycle, not against it</title>
    <meta
      name="description"
      content="Omahi shapes your work, food, movement and rest around the four phases of your cycle — one gentle suggestion at a time. Join the waitlist."
    />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://omahi.app" />
    <meta property="og:title" content="Omahi — plan with your cycle, not against it" />
    <meta
      property="og:description"
      content="Cycle-aware planning for your work, food, movement and rest. Warm, calm, never clinical. Join the waitlist."
    />
    <meta name="twitter:card" content="summary" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Copy public assets**

```bash
mkdir -p apps/landing/public apps/landing/src/lib apps/landing/src/components apps/landing/tests
cp apps/extension/assets/favicon.svg apps/landing/public/favicon.svg
cp apps/extension/assets/logo/omahi-wordmark-gradient.svg apps/landing/public/
cp apps/extension/assets/logo/omahi-wordmark-white.svg apps/landing/public/
```

- [ ] **Step 7: Write `apps/landing/src/landing.css`**

```css
/* Landing-only styles; all tokens and fonts come from @omahi/ui. */
@import '@omahi/ui/theme.css';
@source '../../../packages/ui/src';

@theme {
  /* Floating glass pills in the hero mockup. */
  --animate-float: float 5s ease-in-out infinite;
  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-12px);
    }
  }
}

html {
  color-scheme: light;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  color: var(--color-ink);
  -webkit-font-smoothing: antialiased;
  /* Matches the page wrapper's gradient tail so overscroll stays warm. */
  background: #eee4de;
}
```

- [ ] **Step 8: Write `apps/landing/src/config.ts`**

```ts
/**
 * Hand-edited landing page knobs. `waitlistCount` is social proof shown as
 * "Join N+ already on the list" — update it manually as signups grow;
 * set `showSocialProof: false` to hide the count while it's small.
 */
export const config = {
  waitlistCount: 3200,
  showSocialProof: true,
  launchWindow: 'late 2026',
} as const;
```

- [ ] **Step 9: Write `apps/landing/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './landing.css';
import App from './app.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 10: Write `apps/landing/src/app.tsx`** (placeholder body; later tasks each add their section here)

```tsx
export default function App() {
  return (
    <div className="relative overflow-x-hidden bg-[linear-gradient(180deg,#f4eae4_0%,#efe6e0_40%,#eee4de_100%)]">
      <main className="flex min-h-dvh items-center justify-center">
        <span className="font-display text-4xl font-bold text-brand-gradient">omahi</span>
      </main>
    </div>
  );
}
```

- [ ] **Step 11: Add root scripts** — in the root `package.json` `scripts` block, after the existing `build` line, add:

```json
    "dev:landing": "pnpm --filter @omahi/landing dev",
    "build:landing": "pnpm --filter @omahi/landing build",
```

- [ ] **Step 12: Install, build, and eyeball**

```bash
pnpm install
pnpm build:landing
```

Expected: Vite build succeeds, output in `apps/landing/dist/`. Then run `pnpm dev:landing`, open the printed localhost URL, and confirm: warm gradient background, "omahi" wordmark rendered in Quicksand with the brand gradient (proves theme.css + fonts + `@source` all resolve). Stop the dev server.

- [ ] **Step 13: Typecheck + lint sweep**

```bash
pnpm typecheck && pnpm lint
```

Expected: exit 0 (landing has no tests yet — `vitest` isn't run until Task 5).

- [ ] **Step 14: Format and commit**

```bash
pnpm format
git add -A
git commit -m "feat(landing): scaffold Vite + React landing app"
```

---

### Task 5: Waitlist lib (TDD)

Pure functions, exhaustively tested — this is the only unit-tested landing code per the spec.

**Files:**

- Create: `apps/landing/tests/waitlist.test.ts`
- Create: `apps/landing/src/lib/waitlist.ts`

**Interfaces:**

- Produces (used by Task 6):
  - `validateEmail(raw: string): { ok: true; email: string } | { ok: false; message: string }` — trims, then validates; `email` is the trimmed value.
  - `substackSubscribeUrl(email: string): string` — trims + URL-encodes into the subscribe link.
  - `SUBSTACK_SUBSCRIBE_BASE: string` constant.

- [ ] **Step 1: Write the failing test — `apps/landing/tests/waitlist.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { substackSubscribeUrl, validateEmail } from '../src/lib/waitlist';

describe('validateEmail', () => {
  it.each(['', '   ', '\t'])('rejects blank input %j with the empty-field message', (raw) => {
    expect(validateEmail(raw)).toEqual({ ok: false, message: 'Pop your email in first.' });
  });

  it.each([
    'plainaddress',
    'missing-at.com',
    'no-domain@',
    '@no-local.com',
    'spaces in@local.com',
    'two@@ats.com',
    'no-tld@domain',
  ])('rejects malformed email %j with the check-again message', (raw) => {
    expect(validateEmail(raw)).toEqual({
      ok: false,
      message: "That doesn't look like an email — mind checking?",
    });
  });

  it.each(['you@email.com', 'first.last+tag@sub.domain.co', 'UPPER@CASE.ORG'])(
    'accepts %j',
    (raw) => {
      expect(validateEmail(raw)).toEqual({ ok: true, email: raw });
    },
  );

  it('trims surrounding whitespace and returns the trimmed email', () => {
    expect(validateEmail('  you@email.com  ')).toEqual({ ok: true, email: 'you@email.com' });
  });
});

describe('substackSubscribeUrl', () => {
  it('builds the prefilled subscribe URL', () => {
    expect(substackSubscribeUrl('you@email.com')).toBe(
      'https://herhustlestack.substack.com/subscribe?email=you%40email.com',
    );
  });

  it('URL-encodes characters that are meaningful in query strings', () => {
    expect(substackSubscribeUrl('a+b&c=d@email.com')).toBe(
      'https://herhustlestack.substack.com/subscribe?email=a%2Bb%26c%3Dd%40email.com',
    );
  });

  it('trims whitespace before encoding', () => {
    expect(substackSubscribeUrl(' you@email.com ')).toBe(
      'https://herhustlestack.substack.com/subscribe?email=you%40email.com',
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm --filter @omahi/landing exec vitest run
```

Expected: FAIL — cannot resolve `../src/lib/waitlist`.

- [ ] **Step 3: Write `apps/landing/src/lib/waitlist.ts`**

```ts
/**
 * Waitlist plumbing — pure functions only, so they stay trivially testable.
 * The waitlist lives on Substack: we validate locally, then send the visitor
 * to the subscribe page with their email prefilled (no API, no CORS, no key).
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SUBSTACK_SUBSCRIBE_BASE = 'https://herhustlestack.substack.com/subscribe';

export type EmailValidation = { ok: true; email: string } | { ok: false; message: string };

export function validateEmail(raw: string): EmailValidation {
  const email = raw.trim();
  if (!email) {
    return { ok: false, message: 'Pop your email in first.' };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, message: "That doesn't look like an email — mind checking?" };
  }
  return { ok: true, email };
}

export function substackSubscribeUrl(email: string): string {
  return `${SUBSTACK_SUBSCRIBE_BASE}?email=${encodeURIComponent(email.trim())}`;
}
```

- [ ] **Step 4: Run tests with coverage to verify they pass**

```bash
pnpm --filter @omahi/landing test
```

Expected: all tests PASS, coverage 100% across the board for `src/lib/**`.

- [ ] **Step 5: Format and commit**

```bash
pnpm format
git add apps/landing/src/lib apps/landing/tests
git commit -m "feat(landing): waitlist email validation and Substack subscribe URL"
```

---

### Task 6: Waitlist form component

Two-state glass card: the form, and the post-submit "Almost done" state (spec overrides the design's "You're on the list" copy because subscription completes in the Substack tab). Includes a visible fallback link for blocked popups.

**Files:**

- Create: `apps/landing/src/components/waitlist-form.tsx`

**Interfaces:**

- Consumes: `validateEmail`, `substackSubscribeUrl` (Task 5); `GlassCard` (Task 3); `config` (Task 4).
- Produces (used by Task 7): `WaitlistForm()` — self-contained, no props.

- [ ] **Step 1: Write `apps/landing/src/components/waitlist-form.tsx`**

Note the `noValidate` on the form: without it the browser's native `type="email"` validation blocks submit before React sees it, and the design's custom error copy would never appear.

```tsx
import { GlassCard } from '@omahi/ui';
import { useRef, useState, type FormEvent } from 'react';
import { config } from '../config';
import { substackSubscribeUrl, validateEmail } from '../lib/waitlist';

const proofLine = config.showSocialProof
  ? `Join ${config.waitlistCount.toLocaleString()}+ already on the list · no spam, ever`
  : "No spam, ever — one warm hello when it's ready.";

/**
 * Email capture card. Valid submit opens the Substack subscribe page (email
 * prefilled) in a new tab and flips to an "Almost done" state that keeps a
 * visible link for the popup-blocked case.
 */
export function WaitlistForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [savedEmail, setSavedEmail] = useState('');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateEmail(emailRef.current?.value ?? '');
    if (!result.ok) {
      setError(result.message);
      return;
    }
    window.open(substackSubscribeUrl(result.email), '_blank', 'noopener');
    setError('');
    setSavedEmail(result.email);
  }

  if (savedEmail) {
    return (
      <GlassCard className="max-w-[480px] bg-glass-soft p-[22px] shadow-[0_18px_48px_rgba(46,34,38,0.1)]">
        <div className="flex items-start gap-3.5">
          <div className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(160deg,#ff8264_0%,#c94e86_100%)] text-[21px] font-bold text-white">
            ✓
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[19px] font-semibold tracking-[-0.01em]">Almost done</div>
            <div className="text-[14.5px] leading-[1.55] text-ink/60">
              Finish subscribing in the Substack tab we just opened — we'll email{' '}
              <b className="font-bold text-ink">{savedEmail}</b> when your phase is ready.
            </div>
            <a
              href={substackSubscribeUrl(savedEmail)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-[14px] font-bold text-rose"
            >
              Tab didn't open? Join the waitlist here
            </a>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="max-w-[480px] bg-glass-soft p-[22px] shadow-[0_18px_48px_rgba(46,34,38,0.1)]">
      <div className="flex flex-col gap-3">
        <div className="text-[17px] font-semibold tracking-[-0.01em]">Join the waitlist</div>
        <form noValidate onSubmit={onSubmit} className="flex flex-wrap gap-2.5">
          <input
            ref={emailRef}
            onInput={() => setError('')}
            type="email"
            placeholder="you@email.com"
            aria-label="Email address"
            className={`min-w-0 flex-[1_1_200px] rounded-[14px] border-[1.5px] bg-white/60 px-4 py-3.5 text-base text-ink outline-none focus:border-rose ${
              error ? 'border-[#e0a7a0]' : 'border-white/80'
            }`}
          />
          <button
            type="submit"
            className="cursor-pointer rounded-[14px] border-none bg-rose px-6 py-3.5 text-[15px] font-bold whitespace-nowrap text-white shadow-[0_8px_20px_rgba(214,69,112,0.32)] hover:brightness-105"
          >
            Get early access
          </button>
        </form>
        {error && <div className="text-[13.5px] font-semibold text-danger">{error}</div>}
        <div className="text-[13px] text-ink/45">{proofLine}</div>
      </div>
    </GlassCard>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
pnpm --filter @omahi/landing typecheck && pnpm lint
```

Expected: exit 0. (Visual/behavior verification happens in Task 7 Step 4 once the hero mounts this component.)

- [ ] **Step 3: Format and commit**

```bash
pnpm format
git add apps/landing/src/components/waitlist-form.tsx
git commit -m "feat(landing): waitlist form with error and almost-done states"
```

---

### Task 7: Nav + Hero (with glass product mockup)

**Files:**

- Create: `apps/landing/src/components/nav.tsx`
- Create: `apps/landing/src/components/hero.tsx`
- Modify: `apps/landing/src/app.tsx`

**Interfaces:**

- Consumes: `WaitlistForm` (Task 6), `GlassPanel` (Task 3), `animate-float` utility (Task 4).
- Produces: `Nav()`, `Hero()` — no props.

- [ ] **Step 1: Write `apps/landing/src/components/nav.tsx`**

```tsx
/** Sticky glass nav: wordmark left, section anchors + join CTA right. */
export function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/55 bg-[rgba(243,233,227,0.6)] px-[clamp(18px,5vw,60px)] py-3.5 backdrop-blur-[20px] backdrop-saturate-[1.6]">
      <span className="font-display text-[25px] font-bold tracking-[-0.02em] text-[#c94e86]">
        omahi
      </span>
      <div className="flex items-center gap-[clamp(14px,3vw,34px)]">
        <a href="#how" className="text-[14.5px] font-semibold text-ink/60 hover:text-ink">
          How it works
        </a>
        <a href="#faq" className="text-[14.5px] font-semibold text-ink/60 hover:text-ink">
          FAQ
        </a>
        <a
          href="#join"
          className="rounded-full bg-rose px-5 py-2.5 text-[14.5px] font-bold text-white shadow-[0_6px_18px_rgba(214,69,112,0.3)]"
        >
          Join waitlist
        </a>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Write `apps/landing/src/components/hero.tsx`**

The product mockup is a static composition local to the hero (per spec: not the shared CycleRing — YAGNI). Colors inside it are the design file's literal values.

```tsx
import { GlassPanel } from '@omahi/ui';
import { WaitlistForm } from './waitlist-form';

const PHASE_DOTS = ['#c74b6b', '#e8875b', '#e3a94a', '#96588c'];

/** Static glass rendering of the extension popup — illustration, not the real component. */
function ProductMockup() {
  return (
    <div className="relative w-full max-w-[400px]">
      {/* ambient behind the glass */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[10px] -left-[30px] h-[220px] w-[260px] rounded-full bg-[rgba(232,135,91,0.5)] blur-[60px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[30px] bottom-[20px] h-[220px] w-[240px] rounded-full bg-[rgba(214,69,112,0.42)] blur-[60px]"
      />

      {/* glass popup card */}
      <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/40 shadow-[0_30px_70px_rgba(46,34,38,0.2)] backdrop-blur-[30px] backdrop-saturate-[1.8]">
        <div className="flex flex-col gap-3.5 p-5 pb-6">
          <div className="flex items-center justify-between px-0.5">
            <span className="font-display text-[19px] font-bold tracking-[-0.02em] text-ink/50">
              omahi
            </span>
            <span aria-hidden="true" className="text-sm text-ink/30">
              ⚙
            </span>
          </div>

          {/* phase card */}
          <div className="rounded-[20px] border border-white/70 bg-white/55 px-5 py-[18px] backdrop-blur-[20px] backdrop-saturate-[1.6]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-[0.14em] text-[#d96f3f] uppercase">
                  Follicular · day 9
                </div>
                <div className="mt-[5px] text-[22px] leading-[1.25] font-semibold tracking-[-0.01em]">
                  Big-idea energy
                </div>
              </div>
              <svg width="50" height="50" viewBox="0 0 52 52" aria-hidden="true">
                <circle
                  cx="26"
                  cy="26"
                  r="21.5"
                  fill="none"
                  stroke="rgba(46,34,38,0.1)"
                  strokeWidth="4"
                />
                <circle
                  cx="26"
                  cy="26"
                  r="21.5"
                  fill="none"
                  stroke="#e8875b"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="43 135"
                  transform="rotate(-90 26 26)"
                />
              </svg>
            </div>
            <div className="mt-3.5 flex gap-[5px]">
              <div className="h-[7px] flex-[5] rounded-full bg-[rgba(199,75,107,0.3)]" />
              <div className="relative h-[7px] flex-[7] rounded-full bg-[rgba(232,135,91,0.3)]">
                <div className="absolute inset-y-0 left-0 w-[55%] rounded-full bg-[#e8875b]" />
              </div>
              <div className="h-[7px] flex-[3] rounded-full bg-[rgba(227,169,74,0.3)]" />
              <div className="h-[7px] flex-[13] rounded-full bg-[rgba(150,88,140,0.25)]" />
            </div>
            <div className="mt-2.5 text-xs text-ink/55">Ovulation window opens in 6 days</div>
          </div>

          {/* suggestion rows */}
          <div className="flex flex-col gap-2">
            <GlassPanel className="flex items-start gap-[11px] bg-white/48 px-[15px] py-[11px]">
              <div className="mt-[5px] size-[9px] shrink-0 rounded-full bg-[#e8875b]" />
              <div className="text-[13px] leading-normal">
                <b className="font-bold">Work</b> — start the project you've been circling
              </div>
            </GlassPanel>
            <GlassPanel className="flex items-start gap-[11px] bg-white/48 px-[15px] py-[11px]">
              <div className="mt-[5px] size-[9px] shrink-0 rounded-full bg-[#e8875b]" />
              <div className="text-[13px] leading-normal">
                <b className="font-bold">Move</b> — mid-range intensity; energy is climbing
              </div>
            </GlassPanel>
          </div>

          {/* nudge */}
          <div className="rounded-[14px] border border-[rgba(232,135,91,0.28)] bg-[rgba(232,135,91,0.16)] px-[15px] py-3 text-[12.5px] leading-[1.55]">
            <b className="font-bold text-[#c25e2f]">Today's nudge</b> · That idea from yesterday?
            Today's the day to open the doc.
          </div>
        </div>
      </div>

      {/* floating glass pills */}
      <div className="animate-float absolute top-[30px] -right-[18px] flex items-center gap-[9px] rounded-[14px] border border-white/75 bg-white/55 px-[13px] py-[9px] shadow-[0_14px_30px_rgba(46,34,38,0.14)] backdrop-blur-[20px] backdrop-saturate-[1.7]">
        <div className="size-2.5 rounded-full bg-[#e3a94a]" />
        <span className="text-[12.5px] font-bold">Ovulation in 6 days</span>
      </div>
      <div
        className="animate-float absolute bottom-[30px] -left-[20px] flex items-center gap-[9px] rounded-[14px] border border-white/75 bg-white/55 px-[13px] py-[9px] shadow-[0_14px_30px_rgba(46,34,38,0.14)] backdrop-blur-[20px] backdrop-saturate-[1.7]"
        style={{ animationDuration: '6s', animationDelay: '0.6s' }}
      >
        <div className="size-2.5 rounded-full bg-[#c74b6b]" />
        <span className="text-[12.5px] font-bold">Rest counts as progress</span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <header className="relative overflow-hidden px-[clamp(18px,5vw,60px)] pt-[clamp(44px,7vw,92px)] pb-[clamp(52px,8vw,104px)]">
      {/* ambient light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[120px] -right-[80px] h-[440px] w-[520px] rounded-full bg-[rgba(255,130,100,0.5)] blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[120px] right-[200px] h-[340px] w-[380px] rounded-full bg-[rgba(227,169,74,0.32)] blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[160px] -left-[100px] h-[460px] w-[520px] rounded-full bg-[rgba(150,88,140,0.34)] blur-[95px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[40px] left-[260px] h-[320px] w-[360px] rounded-full bg-[rgba(214,69,112,0.28)] blur-[90px]"
      />

      <div className="relative mx-auto flex max-w-[1180px] flex-wrap items-center gap-[clamp(36px,6vw,76px)]">
        {/* Left: pitch + form */}
        <div id="join" className="flex min-w-[300px] flex-[1_1_380px] scroll-mt-24 flex-col gap-6">
          <div className="inline-flex items-center gap-2.5 self-start rounded-full border border-white/70 bg-white/50 py-[7px] pr-4 pl-[9px] backdrop-blur-[18px] backdrop-saturate-[1.6]">
            <span className="inline-flex gap-1">
              {PHASE_DOTS.map((color) => (
                <span key={color} className="size-2 rounded-full" style={{ background: color }} />
              ))}
            </span>
            <span className="text-[12.5px] font-bold tracking-[0.02em] text-ink/60">
              Early access · opening in waves
            </span>
          </div>

          <h1 className="m-0 text-[clamp(40px,6vw,66px)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
            Plan your days around <span className="text-[#d14c72]">your cycle</span>, not against
            it.
          </h1>

          <p className="m-0 max-w-[470px] text-[clamp(16px,2vw,19px)] leading-relaxed text-ink/60">
            Omahi shapes your work, food, movement and rest around the four phases of your cycle —
            one gentle suggestion at a time. Warm, calm, never clinical.
          </p>

          <WaitlistForm />
        </div>

        {/* Right: product mockup */}
        <div className="flex min-w-[300px] flex-[1_1_360px] justify-center">
          <ProductMockup />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Mount in `apps/landing/src/app.tsx`** (replace the placeholder `<main>`)

```tsx
import { Hero } from './components/hero';
import { Nav } from './components/nav';

export default function App() {
  return (
    <div className="relative overflow-x-hidden bg-[linear-gradient(180deg,#f4eae4_0%,#efe6e0_40%,#eee4de_100%)]">
      <Nav />
      <Hero />
    </div>
  );
}
```

- [ ] **Step 4: Verify visually and behaviorally**

```bash
pnpm --filter @omahi/landing typecheck && pnpm dev:landing
```

In the browser, confirm against the design:

1. Sticky frosted nav with wordmark + two links + pill CTA.
2. Hero: badge with 4 phase dots, balanced headline with rose-colored "your cycle", pitch paragraph, glass form card, floating mockup with two gently bobbing pills.
3. Form behavior: submit empty → "Pop your email in first."; type `foo` → "That doesn't look like an email — mind checking?"; typing clears the error; `you@email.com` → new tab opens on `herhustlestack.substack.com/subscribe?email=you%40email.com` and the card flips to "Almost done" with the fallback link.
4. Narrow the window to ~375px: columns stack, nothing overflows horizontally.

Stop the dev server.

- [ ] **Step 5: Format and commit**

```bash
pnpm format
git add apps/landing/src
git commit -m "feat(landing): sticky nav and hero with glass product mockup"
```

---

### Task 8: Phase cards + features sections

**Files:**

- Create: `apps/landing/src/components/phase-cards.tsx`
- Create: `apps/landing/src/components/features.tsx`
- Modify: `apps/landing/src/app.tsx`

**Interfaces:**

- Consumes: `GlassCard`, `PHASE_STYLE`, `ambient` (Tasks 1, 3).
- Produces: `PhaseCards()`, `Features()` — no props.

- [ ] **Step 1: Write `apps/landing/src/components/phase-cards.tsx`**

Phase colors come from `PHASE_STYLE` tokens (per spec), so they stay in lockstep with the extension; the per-card glow uses `ambient()` at the design's alpha.

```tsx
import { ambient, GlassCard, PHASE_STYLE } from '@omahi/ui';

const PHASES: Array<{
  phase: keyof typeof PHASE_STYLE;
  name: string;
  motto: string;
  copy: string;
}> = [
  {
    phase: 'menstruation',
    name: 'Menstruation',
    motto: 'Rest & reflect',
    copy: 'Lighter schedule, warmer meals, gentle movement. Omahi keeps the day soft.',
  },
  {
    phase: 'follicular',
    name: 'Follicular',
    motto: 'Build & begin',
    copy: 'Energy climbing. A good week to start projects and push a little harder.',
  },
  {
    phase: 'ovulation',
    name: 'Ovulation',
    motto: 'Shine & connect',
    copy: 'Peak energy. Take the big meeting, the pitch, the hard conversation.',
  },
  {
    phase: 'luteal',
    name: 'Luteal',
    motto: 'Settle & sort',
    copy: 'Wind down. Clear the small stuff so next cycle starts clean.',
  },
];

export function PhaseCards() {
  return (
    <section
      id="how"
      className="relative scroll-mt-16 overflow-hidden px-[clamp(18px,5vw,60px)] py-[clamp(52px,8vw,92px)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[30px] left-1/2 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-[rgba(227,169,74,0.16)] blur-[100px]"
      />
      <div className="relative mx-auto max-w-[1180px]">
        <div className="mb-11 text-center">
          <div className="mb-3 text-[12.5px] font-bold tracking-[0.2em] text-[#c15b7a] uppercase">
            Four phases, one companion
          </div>
          <h2 className="m-0 text-[clamp(28px,4.5vw,44px)] leading-[1.1] font-semibold tracking-[-0.02em]">
            Your body has a rhythm. Omahi plans with it.
          </h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
          {PHASES.map(({ phase, name, motto, copy }) => {
            const style = PHASE_STYLE[phase];
            return (
              <div key={phase} className="relative overflow-hidden rounded-[22px]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 blur-[44px]"
                  style={{ background: ambient(style.color, 45) }}
                />
                <GlassCard className="relative flex h-full flex-col gap-[11px] px-6 py-[26px]">
                  <div
                    className="size-[38px] rounded-xl"
                    style={{
                      background: style.color,
                      boxShadow: `0 6px 16px ${ambient(style.color, 40)}`,
                    }}
                  />
                  <div className="text-xl font-semibold tracking-[-0.01em]">{name}</div>
                  <div
                    className="text-[11.5px] font-extrabold tracking-[0.1em] uppercase"
                    style={{ color: style.deep }}
                  >
                    {motto}
                  </div>
                  <div className="text-sm leading-[1.6] text-ink/60">{copy}</div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write `apps/landing/src/components/features.tsx`**

```tsx
import { GlassCard } from '@omahi/ui';

const FEATURES = [
  {
    title: 'One glance every morning',
    copy: "Your new tab shows the phase you're in and the single thing worth focusing on today.",
  },
  {
    title: 'Work, food, movement, rest',
    copy: 'Suggestions across every part of your day, shaped by where you are in your cycle.',
  },
  {
    title: 'Warm, never clinical',
    copy: 'Guidance that reads like a friend who gets it — lifestyle, not medicine. You decide.',
  },
  {
    title: 'Private by design',
    copy: 'Your cycle is yours. Omahi keeps your data on your device — no selling, ever.',
  },
];

export function Features() {
  return (
    <section className="relative overflow-hidden px-[clamp(18px,5vw,60px)] py-[clamp(52px,8vw,92px)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[60px] bottom-0 h-[360px] w-[520px] rounded-full bg-[rgba(214,69,112,0.14)] blur-[100px]"
      />
      <div className="relative mx-auto max-w-[1180px]">
        <div className="mb-11 text-center">
          <div className="mb-3 text-[12.5px] font-bold tracking-[0.2em] text-[#c15b7a] uppercase">
            What you get
          </div>
          <h2 className="m-0 text-[clamp(28px,4.5vw,44px)] leading-[1.1] font-semibold tracking-[-0.02em]">
            A calmer way to run your week.
          </h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {FEATURES.map(({ title, copy }, index) => (
            <GlassCard
              key={title}
              className="flex flex-col gap-3 px-[26px] py-7 shadow-[0_12px_34px_rgba(46,34,38,0.06)]"
            >
              <div className="flex size-11 items-center justify-center rounded-[13px] bg-[linear-gradient(160deg,#ff8264_0%,#c94e86_100%)] text-xl font-bold text-white">
                {index + 1}
              </div>
              <div className="text-[19px] font-semibold tracking-[-0.01em]">{title}</div>
              <div className="text-sm leading-[1.6] text-ink/60">{copy}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Add both sections to `apps/landing/src/app.tsx`**

```tsx
import { Features } from './components/features';
import { Hero } from './components/hero';
import { Nav } from './components/nav';
import { PhaseCards } from './components/phase-cards';

export default function App() {
  return (
    <div className="relative overflow-x-hidden bg-[linear-gradient(180deg,#f4eae4_0%,#efe6e0_40%,#eee4de_100%)]">
      <Nav />
      <Hero />
      <PhaseCards />
      <Features />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

```bash
pnpm --filter @omahi/landing typecheck && pnpm dev:landing
```

Confirm: 4 phase cards with per-phase glow, icon chips, uppercase mottos in the phase's deep color; 4 numbered feature cards with gradient chips; the nav's "How it works" link scrolls to the phase section. Check the auto-fit grids collapse cleanly at narrow widths. Stop the dev server.

- [ ] **Step 5: Format and commit**

```bash
pnpm format
git add apps/landing/src
git commit -m "feat(landing): phase cards and feature grid"
```

---

### Task 9: FAQ accordion

**Files:**

- Create: `apps/landing/src/components/faq.tsx`
- Modify: `apps/landing/src/app.tsx`

**Interfaces:**

- Consumes: `config.launchWindow` (Task 4).
- Produces: `Faq()` — no props. Single-open accordion, first item open by default, `+` rotates 45° when open.

- [ ] **Step 1: Write `apps/landing/src/components/faq.tsx`**

```tsx
import { useState } from 'react';
import { config } from '../config';

const FAQS = [
  {
    q: 'Is Omahi just a period tracker?',
    a: "It follows your cycle, but the point isn't logging days — it's turning where you are into gentle, practical suggestions for your work, food, movement and rest.",
  },
  {
    q: 'Is this medical advice?',
    a: 'No. Every suggestion is lifestyle, not medicine. Omahi suggests, never prescribes, and the disclaimer stays visible throughout the app.',
  },
  {
    q: 'When does it launch?',
    a: `We're opening to the waitlist in waves through ${config.launchWindow}. Earlier signups get in sooner.`,
  },
  {
    q: 'What will it cost?',
    a: 'Waitlist members get an extended free trial and founding-member pricing when we launch.',
  },
  {
    q: 'Where does Omahi run?',
    a: 'It starts as a Chrome new-tab companion, so your phase greets you every morning — with mobile following close behind.',
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section
      id="faq"
      className="relative scroll-mt-16 overflow-hidden px-[clamp(18px,5vw,60px)] py-[clamp(44px,6vw,76px)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[20px] -left-[60px] h-[340px] w-[460px] rounded-full bg-[rgba(150,88,140,0.14)] blur-[100px]"
      />
      <div className="relative mx-auto max-w-[760px]">
        <div className="mb-[38px] text-center">
          <div className="mb-3 text-[12.5px] font-bold tracking-[0.2em] text-[#c15b7a] uppercase">
            Good questions
          </div>
          <h2 className="m-0 text-[clamp(26px,4vw,40px)] leading-[1.1] font-semibold tracking-[-0.02em]">
            Before you join
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {FAQS.map(({ q, a }, index) => {
            const isOpen = open === index;
            return (
              <div
                key={q}
                className="overflow-hidden rounded-[18px] border border-white/68 bg-white/52 backdrop-blur-[22px] backdrop-saturate-[1.6]"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent px-[22px] py-[19px] text-left font-sans text-[17px] font-semibold tracking-[-0.01em] text-ink"
                >
                  <span>{q}</span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-[22px] leading-none text-[#c94e86] transition-transform duration-200 ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-[22px] pb-5 text-[15px] leading-[1.65] text-ink/60">{a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add to `apps/landing/src/app.tsx`** — add `import { Faq } from './components/faq';` and render `<Faq />` after `<Features />`.

- [ ] **Step 3: Verify**

```bash
pnpm --filter @omahi/landing typecheck && pnpm dev:landing
```

Confirm: five questions; first open by default; opening one closes the other; clicking an open item closes it (all closed is allowed); the `+` rotates to `×` orientation; nav "FAQ" link scrolls here. Stop the dev server.

- [ ] **Step 4: Format and commit**

```bash
pnpm format
git add apps/landing/src
git commit -m "feat(landing): FAQ accordion"
```

---

### Task 10: Closing CTA, footer, final composition, deploy README

**Files:**

- Create: `apps/landing/src/components/closing-cta.tsx`
- Create: `apps/landing/src/components/footer.tsx`
- Create: `apps/landing/README.md`
- Modify: `apps/landing/src/app.tsx`

**Interfaces:**

- Consumes: nothing new.
- Produces: the finished page and the documented deploy path.

- [ ] **Step 1: Write `apps/landing/src/components/closing-cta.tsx`**

```tsx
/** Brand-gradient closing panel: wordmark, "Love every phase.", CTA back to the form. */
export function ClosingCta() {
  return (
    <section className="px-[clamp(18px,5vw,60px)] pt-[clamp(18px,5vw,44px)] pb-[clamp(48px,7vw,88px)]">
      <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[30px] bg-[linear-gradient(160deg,#ff8264_0%,#e45a7e_55%,#c94e86_100%)] px-[clamp(24px,5vw,64px)] py-[clamp(44px,7vw,82px)] shadow-[0_30px_70px_rgba(201,78,134,0.34)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[30px] -left-[40px] h-[260px] w-[320px] rounded-full bg-[rgba(255,190,150,0.5)] blur-[70px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[50px] bottom-[20px] h-[260px] w-[320px] rounded-full bg-[rgba(180,70,140,0.5)] blur-[75px]"
        />
        <div className="relative flex flex-col items-center gap-[22px] text-center">
          <span className="font-display text-[clamp(48px,7vw,78px)] leading-none font-bold tracking-[-0.02em] text-white">
            omahi
          </span>
          <h2 className="m-0 text-[clamp(26px,4vw,42px)] leading-[1.1] font-semibold tracking-[-0.02em] text-balance text-white">
            Love every phase.
          </h2>
          <p className="m-0 max-w-[440px] text-[clamp(15px,2vw,18px)] leading-[1.55] text-white/85">
            Join the waitlist and be among the first to plan with your cycle, not against it.
          </p>
          <a
            href="#join"
            className="mt-1 rounded-full border border-white/60 bg-white/92 px-8 py-[15px] text-base font-bold text-[#c94e86] shadow-[0_12px_30px_rgba(46,34,38,0.2)] backdrop-blur-[10px] hover:brightness-[0.97]"
          >
            Get early access
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write `apps/landing/src/components/footer.tsx`**

```tsx
/** Wordmark + the project's hard-rule disclaimer line. */
export function Footer() {
  return (
    <footer className="border-t border-white/50 px-[clamp(18px,5vw,60px)] pt-[34px] pb-[46px]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3.5">
        <span className="font-display text-[21px] font-bold tracking-[-0.02em] text-[#c94e86]">
          omahi
        </span>
        <span className="text-[13.5px] text-ink/40">
          Lifestyle guidance, not medical advice. © 2026 Omahi.
        </span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Final `apps/landing/src/app.tsx`**

```tsx
import { ClosingCta } from './components/closing-cta';
import { Faq } from './components/faq';
import { Features } from './components/features';
import { Footer } from './components/footer';
import { Hero } from './components/hero';
import { Nav } from './components/nav';
import { PhaseCards } from './components/phase-cards';

export default function App() {
  return (
    <div className="relative overflow-x-hidden bg-[linear-gradient(180deg,#f4eae4_0%,#efe6e0_40%,#eee4de_100%)]">
      <Nav />
      <Hero />
      <PhaseCards />
      <Features />
      <Faq />
      <ClosingCta />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 4: Write `apps/landing/README.md`**

````markdown
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
````

- [ ] **Step 5: Full verification (CI-equivalent sweep)**

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm e2e && pnpm build:landing
```

Expected: every stage green. Then `pnpm dev:landing` for a last full-page pass against the design: nav → hero (form flow incl. new-tab open) → phase cards → features → FAQ → closing CTA (button scrolls back to the form) → footer disclaimer. Check ~375px, ~768px, and ~1280px widths; confirm no horizontal scrollbar at any of them. Stop the dev server.

- [ ] **Step 6: Format and commit**

```bash
pnpm format
git add apps/landing
git commit -m "feat(landing): closing CTA, footer, and deploy docs"
```

- [ ] **Step 7: Push and open the PR**

```bash
git push -u origin feat/landing-page
```

PR title: `feat: landing page + shared @omahi/ui glass library`. Body: summary of the two deliverables (packages/ui extraction, apps/landing), note that extension changes are import-path-only and covered by the existing e2e suite, and list the manual follow-up (Cloudflare project + omahi.app domain attachment in the dashboard, per `apps/landing/README.md`). No AI-attribution footer.

---

## Post-plan notes for the reviewer

- **Deviation from spec (deliberate):** the spec's dark-mode block moves to `theme.css` unchanged; this plan scopes it to `:root:not([data-theme='light'])` so the light-only landing page isn't broken for dark-OS visitors. Extension behavior is identical (it never sets `data-theme`).
- **Deviation from design (per spec):** the post-submit card says "Almost done" (finish in the Substack tab) instead of the design's "You're on the list", because subscription completes on Substack. Spec section "Behavior" is the authority here.
- **Out of scope (per spec):** extension adoption of `GlassCard`, analytics, cookie banners, backend, landing e2e.
- **Open item (manual):** Cloudflare project creation + omahi.app domain attachment happen in the dashboard.
