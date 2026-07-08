# New Tab Glass Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the new-tab battery dashboard with the Glass Board design: centered live clock hero + one frosted-glass phase widget over a phase-tinted field.

**Architecture:** `apps/extension/lib/newtab.ts` stays the pure, unit-tested view-model (status line + ring fraction + tip, plus pure clock/greeting formatters); `entrypoints/newtab/app.tsx` renders it with theme tokens so the existing `data-surface="newtab"` dark-mode override keeps working. Spec: `docs/superpowers/specs/2026-07-08-newtab-glass-board-design.md`.

**Tech Stack:** React 19, Tailwind v4 (`@theme` tokens in `apps/extension/assets/theme.css`), Vitest, Playwright.

## Global Constraints

- `packages/core` untouched — all needed math (`getPhase`, `daysUntilNextPhase`) already exists.
- New-tab page is READ-ONLY over storage; keep the `storage.onChanged` + `visibilitychange` reload wiring in `app.tsx` exactly as-is.
- Keep `data-newtab="dashboard" | "disabled" | "setup"` and `data-onboarded` attributes — e2e depends on them.
- Health copy stays suggestion-framed, never verdict language.
- All commands run from the repo root.
- Status copy (exact strings): menstruation `Rest counts as progress today`; follicular `Energy is climbing this week`; ovulation `Peak energy · your best week`; luteal ≤7 days to period `Period expected in ~N days` (singular `day` at 1), else `Steady energy — good week to finish things`.

**Before Task 1:** the working tree carries an uncommitted polish pass (icons, calendar, dashboard tweaks). Commit it first so this feature's commits stay atomic:

```bash
git add -A
git commit -m "chore: polish pass follow-ups (icons, newtab, calendar)"
```

---

### Task 1: View-model — status lines, ring fraction, clock/greeting formatters

**Files:**
- Modify: `apps/extension/lib/newtab.ts` (full rewrite below)
- Test: `apps/extension/tests/newtab.test.ts` (full rewrite below)

**Interfaces:**
- Consumes: `getPhase(config, today)` from `@omahi/core` (returns `{ phase, cycleDay, ... }`).
- Produces (Task 2 imports all of these from `../../lib/newtab`):
  - `getNewTabModel(config: CycleConfig, today: Date): NewTabModel` where `NewTabModel = { phase: Phase; cycleDay: number; cycleLength: number; ringFraction: number; statusLine: string; tip: string }`
  - `getGreeting(date: Date): string`
  - `formatClock(date: Date, locale?: string): string`
  - `formatDateLine(date: Date, locale?: string): string`

- [ ] **Step 1: Replace the test file with failing tests**

Overwrite `apps/extension/tests/newtab.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import type { CycleConfig } from '@omahi/core';
import { formatClock, formatDateLine, getGreeting, getNewTabModel } from '../lib/newtab';

// Phase ranges for this config: menstruation 1–5, follicular 6–12,
// ovulation 13–15, luteal 16–28.
const config: CycleConfig = { anchorDate: '2026-06-20', cycleLength: 28, periodLength: 5 };

function at(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 9);
}

describe('getNewTabModel', () => {
  it.each([
    ['2026-06-21', 'menstruation', 2, 'Rest counts as progress today'],
    ['2026-06-28', 'follicular', 9, 'Energy is climbing this week'],
    ['2026-07-03', 'ovulation', 14, 'Peak energy · your best week'],
    ['2026-07-16', 'luteal', 27, 'Period expected in ~2 days'],
  ])('%s → %s day %i', (iso, phase, cycleDay, statusLine) => {
    const model = getNewTabModel(config, at(iso));
    expect(model).toMatchObject({ phase, cycleDay, cycleLength: 28, statusLine });
    expect(model.tip).not.toBe('');
  });

  it('fills the ring proportionally to the cycle day', () => {
    expect(getNewTabModel(config, at('2026-06-28')).ringFraction).toBeCloseTo(9 / 28);
    expect(getNewTabModel(config, at('2026-07-17')).ringFraction).toBe(1);
  });

  it('gates the luteal countdown to the final week', () => {
    // Day 22 → 7 days out: countdown. Day 21 → 8 days out: energy line.
    expect(getNewTabModel(config, at('2026-07-11')).statusLine).toBe('Period expected in ~7 days');
    expect(getNewTabModel(config, at('2026-07-10')).statusLine).toBe(
      'Steady energy — good week to finish things',
    );
  });

  it('uses the singular on the last cycle day', () => {
    expect(getNewTabModel(config, at('2026-07-17')).statusLine).toBe('Period expected in ~1 day');
  });
});

describe('getGreeting', () => {
  it.each([
    [4, 'Good evening'],
    [5, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [16, 'Good afternoon'],
    [17, 'Good evening'],
  ])('%i:00 → %s', (hour, greeting) => {
    expect(getGreeting(new Date(2026, 6, 10, hour, 0))).toBe(greeting);
  });
});

describe('clock formatting', () => {
  it('drops the day period in 12-hour locales', () => {
    expect(formatClock(new Date(2026, 6, 10, 9, 41), 'en-US')).toBe('9:41');
    expect(formatClock(new Date(2026, 6, 10, 14, 15), 'en-US')).toBe('2:15');
  });

  it('leaves 24-hour locales untouched', () => {
    expect(formatClock(new Date(2026, 6, 10, 14, 15), 'de-DE')).toBe('14:15');
  });

  it('formats the date line as weekday, month day', () => {
    expect(formatDateLine(new Date(2026, 6, 10), 'en-US')).toBe('Friday, July 10');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @omahi/extension exec vitest run tests/newtab.test.ts`
Expected: FAIL — `formatClock`, `formatDateLine`, `getGreeting` are not exported; `statusLine`/`ringFraction` don't exist.

- [ ] **Step 3: Rewrite the view-model**

Overwrite `apps/extension/lib/newtab.ts` with:

```ts
/**
 * Pure view-model for the new-tab page (Glass Board design): one frosted
 * widget — cycle-ring progress, a per-phase status line, one tip — plus pure
 * clock/greeting formatters so the component stays free of date logic.
 *
 * Copy is per-phase for now (finalized in the new-tab design handoff). If we
 * later author per-day copy, extend `PHASE_COPY` to key on `cycleDay` — the
 * component renders whatever this model returns.
 */

import { getPhase, type CycleConfig, type Phase } from '@omahi/core';

export interface NewTabModel {
  phase: Phase;
  cycleDay: number;
  cycleLength: number;
  /** 0–1 cycle progress for the widget's SVG ring stroke. */
  ringFraction: number;
  /** Status line under the phase title inside the widget. */
  statusLine: string;
  /** Rendered after the "One thing for today:" lead-in. */
  tip: string;
}

interface PhaseCopy {
  statusLine: (daysToPeriod: number) => string;
  tip: string;
}

/** The luteal status line switches to a period countdown this close to day 1. */
const COUNTDOWN_WINDOW_DAYS = 7;

// Copy is final per the design handoff: non-prescriptive, permission-framed —
// never verdict language. Keep that register when editing.
const PHASE_COPY: Record<Phase, PhaseCopy> = {
  menstruation: {
    statusLine: () => 'Rest counts as progress today',
    tip: 'keep the schedule light — cancel or move one thing if you can.',
  },
  follicular: {
    statusLine: () => 'Energy is climbing this week',
    tip: "open the project you've been putting off — starting feels easier this week.",
  },
  ovulation: {
    statusLine: () => 'Peak energy · your best week',
    tip: "schedule the hard conversation or big pitch — you'll land it best now.",
  },
  luteal: {
    statusLine: (daysToPeriod) =>
      daysToPeriod <= COUNTDOWN_WINDOW_DAYS
        ? `Period expected in ~${daysToPeriod} ${daysToPeriod === 1 ? 'day' : 'days'}`
        : 'Steady energy — good week to finish things',
    tip: 'clear the small stuff off your list — deep focus comes back next week.',
  },
};

export function getNewTabModel(config: CycleConfig, today: Date): NewTabModel {
  const info = getPhase(config, today);
  const copy = PHASE_COPY[info.phase];
  // Day after the cycle's last day is the next day 1 (in luteal this equals
  // daysUntilNextPhase, but the formula holds for every phase).
  const daysToPeriod = config.cycleLength - info.cycleDay + 1;
  return {
    phase: info.phase,
    cycleDay: info.cycleDay,
    cycleLength: config.cycleLength,
    ringFraction: info.cycleDay / config.cycleLength,
    statusLine: copy.statusLine(daysToPeriod),
    tip: copy.tip,
  };
}

export function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Locale-aware wall-clock time without the day period — the greeting already
 * says which half of the day it is (12h locales get "9:41", 24h get "14:15").
 * `locale` is a test seam; production callers omit it (system locale).
 */
export function formatClock(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
    .formatToParts(date)
    .filter((part) => part.type !== 'dayPeriod')
    .map((part) => part.value)
    .join('')
    .trim();
}

/** "Friday, July 10" (localized). `locale` is a test seam like formatClock's. */
export function formatDateLine(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @omahi/extension exec vitest run tests/newtab.test.ts`
Expected: PASS (all suites). Note: `app.tsx` still references removed fields — that's Task 2; the unit test file itself must be green.

- [ ] **Step 5: Commit**

```bash
git add apps/extension/lib/newtab.ts apps/extension/tests/newtab.test.ts
git commit -m "feat(extension): glass-board view-model with status lines and clock formatters"
```

---

### Task 2: Glass tokens + component rewrite

**Files:**
- Modify: `apps/extension/assets/theme.css` (add glass tokens, drop `--color-ring-track`)
- Modify: `apps/extension/entrypoints/newtab/app.tsx` (replace `NewTabDashboard`, add clock)

**Interfaces:**
- Consumes: everything from Task 1's Produces block; `PHASE_STYLE[phase].color/.deep` from `../../components/phase-style`; `GearIcon` from `../../components/icons`.
- Produces: rendered markup with `data-newtab="dashboard"` (root) and `data-newtab="clock"` (time element) — Task 3's e2e selectors.

- [ ] **Step 1: Update theme tokens**

In `apps/extension/assets/theme.css`, inside the `@theme` block, replace:

```css
  /* Unswept remainder of the new-tab cycle ring. */
  --color-ring-track: #ede0ea;
```

with:

```css
  /* Frosted new-tab widget surface + edge. */
  --color-glass: rgba(255, 255, 255, 0.55);
  --color-glass-border: rgba(255, 255, 255, 0.75);
```

In the `[data-surface='newtab']` dark block, replace the line `--color-ring-track: #40323a;` with:

```css
    --color-glass: rgba(38, 30, 42, 0.55);
    --color-glass-border: rgba(255, 255, 255, 0.12);
```

- [ ] **Step 2: Rewrite the dashboard component**

In `apps/extension/entrypoints/newtab/app.tsx`, update the imports (drop `PrimaryButton` — still used by `SetupState`, keep it; drop nothing else, add the new model helpers and React hooks):

```tsx
import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { GearIcon } from '../../components/icons';
import { PrimaryButton } from '../../components/onboarding/buttons';
import { PHASE_STYLE } from '../../components/phase-style';
import { formatClock, formatDateLine, getGreeting, getNewTabModel } from '../../lib/newtab';
import { effectiveCycleConfig } from '../../lib/period-log';
import { omahiStorage, type OmahiState } from '../../lib/storage';
```

Keep `Wordmark`, `DisabledState`, `SetupState`, and `App` exactly as they are, except `Wordmark`: the mock quiets it to plain ink — replace its body with:

```tsx
function Wordmark() {
  return (
    <span className="font-display text-2xl font-bold tracking-tight text-ink/35">omahi</span>
  );
}
```

Add a minute-aligned clock hook and ring component above `NewTabDashboard`:

```tsx
/** Re-renders on each minute boundary so the clock stays right while a tab idles. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(new Date());
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000));
    };
    timer = setTimeout(tick, 60_000 - (Date.now() % 60_000));
    return () => clearTimeout(timer);
  }, []);
  return now;
}

const RING_RADIUS = 20.5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function CycleRing({ fraction, color }: { fraction: number; color: string }) {
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" aria-hidden="true" className="shrink-0">
      <circle
        cx="25"
        cy="25"
        r={RING_RADIUS}
        fill="none"
        stroke="color-mix(in srgb, var(--color-ink) 10%, transparent)"
        strokeWidth="3.5"
      />
      <circle
        cx="25"
        cy="25"
        r={RING_RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${fraction * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
        transform="rotate(-90 25 25)"
      />
    </svg>
  );
}
```

Replace the whole `NewTabDashboard` function with:

```tsx
function NewTabDashboard({ state }: { state: OmahiState }) {
  const now = useNow();
  const model = getNewTabModel(effectiveCycleConfig(state)!, now);
  const { color, deep } = PHASE_STYLE[model.phase];
  // The design darkens the ovulation lead-in for contrast on the glass card;
  // `deep` is that text-on-tint variant (aliases the base everywhere else).
  const tipAccent = model.phase === 'ovulation' ? deep : color;
  const phaseLabel = model.phase.charAt(0).toUpperCase() + model.phase.slice(1);
  const tint = (pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface" data-newtab="dashboard">
      {/* Phase-tinted field: two faint washes + two soft blobs, all token-driven. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(700px 520px at 28% 18%, ${tint(9)}, transparent 70%), radial-gradient(820px 600px at 74% 82%, ${tint(8)}, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute h-[280px] w-[460px] rounded-full blur-[80px]"
        style={{ left: '44%', top: '50%', background: tint(16) }}
      />
      <div
        className="pointer-events-none absolute h-[230px] w-[380px] rounded-full blur-[80px]"
        style={{ left: '58%', top: '62%', background: tint(13) }}
      />

      <div className="relative flex items-center justify-between px-10 py-7">
        <Wordmark />
        <button
          type="button"
          aria-label="Open Omahi"
          onClick={() => void browser.tabs.create({ url: browser.runtime.getURL('/popup.html') })}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink/25 hover:bg-ink/5 hover:text-ink/45"
        >
          <GearIcon size={22} />
        </button>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-12 px-8">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="text-[23px] font-medium text-ink/50">{getGreeting(now)}</div>
          <div
            className="text-[136px] leading-none font-extralight tracking-[-0.02em] text-ink max-[900px]:text-[96px]"
            data-newtab="clock"
          >
            {formatClock(now)}
          </div>
          <div className="mt-2 text-[20px] font-medium text-ink/45">{formatDateLine(now)}</div>
        </div>

        <div className="flex w-[600px] max-w-full flex-col gap-5 rounded-[28px] border border-glass-border bg-glass px-8 py-7 shadow-[0_20px_56px_rgba(46,34,38,0.10)] backdrop-blur-[30px] backdrop-saturate-150">
          <div className="flex items-center gap-5">
            <CycleRing fraction={model.ringFraction} color={color} />
            <div className="flex flex-col gap-1">
              <div className="text-[22px] leading-tight font-semibold">
                {phaseLabel} · Day {model.cycleDay} of {model.cycleLength}
              </div>
              <div className="text-[16px] text-ink/55">{model.statusLine}</div>
            </div>
          </div>
          <div className="h-px bg-ink/10" />
          <div className="text-[17px] leading-normal text-ink/75">
            <b className="font-semibold" style={{ color: tipAccent }}>
              One thing for today:
            </b>{' '}
            {model.tip}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify unit tests, types, lint, and build**

Run: `pnpm --filter @omahi/extension exec vitest run tests/newtab.test.ts && pnpm typecheck && pnpm lint && pnpm build`
Expected: all PASS; build emits `apps/extension/.output/chrome-mv3`.

- [ ] **Step 4: Eyeball both themes (manual)**

Run: `pnpm dev`, open a new tab in the spawned Chrome. Check: live clock (wait a minute boundary), glass widget, phase tint, then flip macOS dark mode — glass darkens, tint stays phase-colored. Close when done.

- [ ] **Step 5: Commit**

```bash
git add apps/extension/assets/theme.css apps/extension/entrypoints/newtab/app.tsx
git commit -m "feat(extension): glass-board new-tab layout with live clock"
```

---

### Task 3: E2E update

**Files:**
- Modify: `e2e/newtab.spec.ts` (first test only)

**Interfaces:**
- Consumes: `data-newtab="dashboard"` / `data-newtab="clock"` markup from Task 2; `seedOnboarded` fixture (`offsetDays: 8` seeds follicular day 9).

- [ ] **Step 1: Update the dashboard spec**

Replace the first test in `e2e/newtab.spec.ts` with (the other three tests stay untouched):

```ts
test('new tab renders the glass dashboard when enabled', async ({ context, extensionId }) => {
  const page = await context.newPage();
  // Follicular day 9; seedOnboarded enables the new-tab override.
  await seedOnboarded(page, extensionId, { offsetDays: 8 });

  await page.goto(`chrome-extension://${extensionId}/newtab.html`);
  await expect(page.locator('[data-newtab="dashboard"]')).toBeVisible();
  await expect(page.locator('[data-newtab="clock"]')).toHaveText(/\d{1,2}[:.]\d{2}/);
  await expect(page.getByText('Follicular · Day 9 of 28')).toBeVisible();
  await expect(page.getByText('Energy is climbing this week')).toBeVisible();
  await expect(page.getByText(/One thing for today:/)).toBeVisible();
});
```

- [ ] **Step 2: Run the e2e suite**

Run: `pnpm build && pnpm e2e`
Expected: all newtab specs PASS (build first — Playwright loads the built extension).

- [ ] **Step 3: Commit**

```bash
git add e2e/newtab.spec.ts
git commit -m "test(e2e): cover glass-board new-tab layout"
```

---

### Task 4: Full suite + spec checkboxes

- [ ] **Step 1: Run everything**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`
Expected: all green.

- [ ] **Step 2: Verify no stray references**

Run: `grep -rn "ring-track\|batteryPct\|batteryLabel\|ringDeg" apps/ e2e/ packages/ --include="*.ts" --include="*.tsx" --include="*.css"`
Expected: no output. If anything shows up, remove the dead reference and re-run Step 1.

- [ ] **Step 3: Commit any cleanup**

Only if Step 2 required changes:

```bash
git add -A
git commit -m "chore(extension): drop dead battery-dashboard references"
```
