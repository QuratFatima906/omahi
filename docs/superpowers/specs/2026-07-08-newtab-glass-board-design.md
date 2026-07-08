# New Tab — Glass Board redesign

Source design: claude.ai/design project `e6d08d9b-c6ba-49bd-9a83-7f7a981085cf`,
file `Omahi New Tab - Glass Board.dc.html` (direction 7). The mock is authored
at 1600×1000 and scaled 0.5 for the board, so its px values are the real
intended sizes.

## Summary

Replace the current new-tab dashboard (battery ring + big headline + tip card)
with the Glass Board layout: a centered ambient clock hero and one frosted
glass widget over a phase-tinted warm field. Layout is identical across
phases — only the ring color, background tint, and copy shift. Light and dark
treatments both ship (dark rides the existing `data-surface="newtab"` token
overrides).

## View-model (`apps/extension/lib/newtab.ts`)

`NewTabModel` becomes:

```ts
interface NewTabModel {
  phase: Phase;
  cycleDay: number;
  cycleLength: number;
  /** 0–1 cycle progress for the SVG ring stroke. */
  ringFraction: number;
  /** Status line under the phase title inside the widget. */
  statusLine: string;
  tip: string;
}
```

Removed: `ringDeg`, `batteryPct`, `batteryLabel`, `headline` (battery metaphor
and headline are gone from the design).

Status lines:

| Phase | Status line |
| --- | --- |
| menstruation | `Rest counts as progress today` |
| follicular | `Energy is climbing this week` (static — no ovulation countdown) |
| ovulation | `Peak energy · your best week` |
| luteal, period ≤ 7 days away | `Period expected in ~N days` (`N = cycleLength − cycleDay + 1`, singular "day" at 1) |
| luteal, earlier | `Steady energy — good week to finish things` |

Tips are unchanged from the current `PHASE_COPY`.

New pure helper `getGreeting(date: Date): string` — `Good morning` (05:00–11:59),
`Good afternoon` (12:00–16:59), `Good evening` (17:00–04:59). Lives in
`lib/newtab.ts` for unit testing; the component passes `new Date()`.

## Clock (component-side, `entrypoints/newtab/app.tsx`)

- Locale-aware via `Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })`
  using `formatToParts`, dropping `dayPeriod` (and its adjacent literal space) —
  12h locales render `9:41`, 24h render `14:15`.
- Live: interval aligned to the next minute boundary; cleaned up on unmount.
- Date line: locale long format, weekday + month + day (`Friday, July 10`).

## Layout

- Top bar unchanged in structure (wordmark left, gear right) but quieter:
  wordmark and gear at ~35% / ~25% ink opacity, no brand gradient.
- Centered column, vertical gap 48px between hero and widget:
  - Greeting: 23px, weight 500, ink at 50%.
  - Clock: 136px, weight 200, `letter-spacing: -0.02em`, full ink. Nunito Sans
    (existing `--font-sans`) at weight 200 stands in for the mock's thin
    system font.
  - Date: 20px, weight 500, ink at 45%, 8px top margin.
- Glass widget: 600px wide (shrinks on narrow viewports), radius 28px,
  `backdrop-blur(30px) saturate(1.5)`, padding 28px 32px, shadow
  `0 20px 56px rgba(46,34,38,0.10)`. Contents:
  - Row: 50px SVG ring + column of phase title and status line (gap 20px).
    - Ring: r=20.5, stroke-width 3.5, track ink at 10%, progress arc in the
      phase color (`PHASE_STYLE[phase].color`), round cap, `rotate(-90 25 25)`,
      `stroke-dasharray = ringFraction × 128.8, 128.8`.
    - Title: `Menstruation · Day 2 of 28` — 22px, weight 600.
    - Status line: 16px, ink at 55%.
  - Hairline divider: 1px, ink at 8%.
  - Tip: 17px/1.5, ink at 75%; standalone sentence, no lead-in or accent.

## Background

On `--color-surface` (keep existing `#fbf5f1`; not the mock's `#F6EFE9`),
three phase-tinted layers using
`color-mix(in srgb, var(--color-<phase>) N%, transparent)` via
`PHASE_STYLE[phase].color` so dark mode inherits from the token flips:

- Two faint radial washes (~8–10% tint) at 28%/18% and 74%/82%.
- Two blurred blobs (`blur(80px)`, ~13–20% tint) in the lower-right quadrant.

## Theme tokens (`assets/theme.css`)

Two new tokens with dark overrides in the existing
`[data-surface='newtab']` dark block:

| Token | Light | Dark |
| --- | --- | --- |
| `--color-glass` | `rgba(255,255,255,0.55)` | `rgba(38,30,42,0.55)` |
| `--color-glass-border` | `rgba(255,255,255,0.75)` | `rgba(255,255,255,0.12)` |

`--color-ring-track` becomes unused by the new tab (calendar keeps its own
usage if any; remove only if orphaned).

## Unchanged

- Read-only storage rule; `storage.onChanged` + visibilitychange reload.
- `SetupState` and `DisabledState`.
- Gear button behavior (opens popup in a tab) and `data-newtab` /
  `data-onboarded` test attributes.
- Dark-mode mechanism (`data-surface="newtab"` + `prefers-color-scheme`).

## Testing

- Unit (`apps/extension/tests/newtab.test.ts`): status line per phase incl.
  luteal 7-day gate boundary (day at exactly 7 days out shows countdown, 8
  does not) and singular `~1 day`; `ringFraction`; `getGreeting` boundaries
  (04:59/05:00, 11:59/12:00, 16:59/17:00). Battery/headline tests removed.
- E2E (`e2e/newtab.spec.ts`): update selectors to the widget — phase title,
  status line, tip visible per seeded phase; clock element present.
