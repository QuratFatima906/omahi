# Omahi — Cycle-Aware Planning Browser Extension

> _O mahi, Love every phase._
> A browser extension that plans your schedule, meals, meetings, workouts, big tasks, and rest around your menstrual cycle's four phases.

---

## 1. Feature Set

### Must Have (MVP)

| #   | Feature                | Description                                                                                                                       |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Cycle setup            | Last period date, cycle length, period length → auto-compute 4 phases                                                             |
| F2  | Phase engine           | Pure logic: given config + date → phase, cycle day, days-until-next-phase, forecast                                               |
| F3  | Popup dashboard        | Current phase, cycle day, today's focus (work mode, food, workout, rest)                                                          |
| F4  | Daily suggestions      | Per `phase + dayOfPhase` content (build-time LLM-generated, human-reviewed, shipped static); deterministic date-seeded daily pick |
| F5  | Phase calendar         | Month view, color-coded phases, predicted period days                                                                             |
| F6  | Manual override        | Log actual period start; corrections re-anchor predictions                                                                        |
| F7  | Local-only storage     | `chrome.storage.local`, no server, no account                                                                                     |
| F8  | Export / import        | JSON backup and restore                                                                                                           |
| F9  | Omahi voice onboarding | Warm, mahiya-toned copy throughout (English-only for v1)                                                                          |
| F10 | New-tab page           | Phase + today's plan on every new tab (toggleable in settings)                                                                    |

### Nice to Have (v2+)

- Weekly planner: drag tasks into phase-scored days
- "Best day for X" finder (task type → optimal upcoming window)
- Google Calendar overlay (content script on calendar.google.com)
- Notifications / nudges in mahiya voice
- Luteal check-in (journaling-lite for noticing unfulfillment/issues)
- Symptom + mood logging → refine predictions
- Recipe suggestions per phase
- Voice packs (Urdu / Punjabi / English)

### Free vs Paid

- **Free** = awareness: tracking, phase calc, dashboard, calendar, override, export
- **Paid** = planning: calendar overlay, weekly planner, best-day finder, nudges, insights, recipes
- Payment infra deferred to v2 (see Open Questions)

---

## 2. Phase → Lifestyle Mapping (product source of truth)

| Phase        | Work                                                | Food                    | Workout                  | Rest/Social            |
| ------------ | --------------------------------------------------- | ----------------------- | ------------------------ | ---------------------- |
| Menstruation | Reflective time, light load                         | Cozy, warm foods        | Low intensity            | High rest              |
| Follicular   | Execution, big ideas                                | Lighter, brighter foods | Mid-range                | Adventure, more energy |
| Ovulation    | Big meetings, pitches                               | Fresh fruits, salads    | Hardest workouts         | Most social            |
| Luteal       | Get organized, details; notice unfulfillment/issues | More calories           | Harder → lighter (taper) | Winding down           |

**Default phase model** (approximation — must be user-adjustable, and flagged in-app as an estimate):

- Day 1 = period start
- Menstruation: day 1 → `periodLength` (default 5)
- Ovulation day ≈ `cycleLength − 14` (luteal length is the more stable half of the cycle)
- Ovulation window: ovulation day −1 → +1
- Follicular: end of period → start of ovulation window
- Luteal: end of ovulation window → `cycleLength`

⚠️ **Honesty notes (bake into copy):**

- These boundaries are heuristics; real ovulation timing varies. Verify the model against a reputable clinical source (e.g., ACOG patient resources) before writing in-app copy.
- All food/workout guidance is **lifestyle suggestion, not medical advice**. The evidence base for "cycle syncing" is limited. Include a disclaimer in onboarding and settings.

---

## 3. UI Design (source of truth)

All MVP screens are designed in the Claude Design project — build UI chunks to match these screens, not from scratch:

- **Project:** [Omahi UI](https://claude.ai/design/p/e6d08d9b-c6ba-49bd-9a83-7f7a981085cf?file=Omahi+UI.dc.html) (project id `e6d08d9b-c6ba-49bd-9a83-7f7a981085cf`, file `Omahi UI.dc.html`; brand guide in `Omahi Brand Guide.dc.html`)
- **Assets:** icons (`assets/icon/` — favicon, 16/32/48/128/512 PNGs, light/dark/gradient SVGs) and logos (`assets/logo/` — wordmarks, badge, lockup) live in the same design project; pull them in for Chunk 10.
- Popup screens are **380px wide**; new-tab is a full-page layout (designed at 1472×920).

### Design tokens

| Token          | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Fonts          | Quicksand (headings/brand), Nunito Sans (body)                                               |
| Brand gradient | `linear-gradient(135deg, #FF7E5F → #D64570)` (dark: `#FF9B7E → #ED6B94`)                     |
| Surfaces       | app bg `#FBF5F1`, cards `#FFFFFF`, canvas `#F2E8E2`; dark bg `#1D1519`, dark cards `#2A1F26` |
| Text           | primary `#2E2226`, secondary `#6E5560`/`#8A7078`, muted `#B08D96`                            |
| Menstruation   | `#C74B6B` on tint `#F3D2DA`                                                                  |
| Follicular     | `#E8875B` on tint `#FAE0CF`                                                                  |
| Ovulation      | `#E3A94A` on tint `#F7E6C6`                                                                  |
| Luteal         | `#96588C` on tint `#E8D6E4`                                                                  |

### Screen → chunk mapping

| Design screen (`data-screen-label`) | What it specifies                                                                                                                                                                                                        | Chunk                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `Onboarding welcome`                | Gradient hero, "Hi, I'm Omahi" intro, disclaimer copy, "Let's begin" CTA                                                                                                                                                 | 3                              |
| `Onboarding step 1`                 | Last-period date via inline month calendar, "Not sure" escape hatch, 3-dot progress                                                                                                                                      | 3                              |
| `Onboarding step 2`                 | Cycle length stepper (−/+) with 21–40 slider, default 28, "Omahi learns as you log" hint                                                                                                                                 | 3                              |
| `Onboarding step 3`                 | Period-length pills (3–7, default 5), **new-tab opt-in toggle**, heuristics disclaimer, "Start planning"                                                                                                                 | 3 (+9 toggle)                  |
| `Popup dashboard`                   | Gradient header w/ calendar+settings nav, phase card (name · cycle day, hero line, day circle, 4-segment phase progress bar, next-phase line), Work/Food/Move/Rest rows, "Today's nudge" tip, "My period started →" link | 4 (+5 content, +7 entry point) |
| `Popup calendar`                    | Month grid, phase-tinted days, today ringed, predicted period dashed, 5-item legend, month nav, "Log period start" CTA                                                                                                   | 6 (+7 CTA)                     |
| `Popup settings`                    | My cycle rows (anchor date, cycle length, period length), new-tab toggle, export/import/delete-all, disclaimer + version footer                                                                                          | 8 (+9 toggle)                  |
| `New tab light` / `New tab dark`    | Greeting hero ("Good morning — …"), phase · day label, date + next-event line, 4 focus cards, phase progress bar + next-period date, settings gear; **dark variant follows system, light default**                       | 9                              |

The design file's embedded demo logic (`DCLogic` in `Omahi UI.dc.html`) holds draft per-phase content — hero lines, work/food/move/rest copy, tips, next-phase lines for all 4 phases — use it as the starting point for Chunk 5's `suggestions.ts` (subject to the copy review in that chunk).

---

## 4. Technical Specs

### Stack (chosen for optimal DX, cost ≈ $0, and AI-friendly code)

| Layer               | Choice                                        | Why                                                                                                                                                                                                                                                                         |
| ------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extension framework | **WXT** (Vite-based)                          | The consensus 2026 recommendation for new extensions: actively maintained, file-based entrypoints, HMR, smaller bundles than Plasmo (which appears to be in maintenance mode). **Launch target: Chrome only** — WXT keeps Firefox/Safari builds available later at low cost |
| Language            | **TypeScript (strict)**                       | Matches your background; strict mode keeps AI-generated code honest                                                                                                                                                                                                         |
| UI                  | **React 18**                                  | Largest ecosystem + best AI training coverage for vibe-coding; WXT is framework-agnostic so this is swappable                                                                                                                                                               |
| Styling             | **Tailwind CSS**                              | Fast iteration, consistent tokens for the Omahi palette                                                                                                                                                                                                                     |
| State               | React state + a thin storage hook             | No Redux/Zustand for MVP — the data model is small                                                                                                                                                                                                                          |
| Storage             | `chrome.storage.local` via WXT's storage util | Local-only = privacy selling point + zero server cost. ⚠️ Verify current WXT storage API (`wxt/utils/storage`) in docs before use — do not assume method names                                                                                                              |
| Unit tests          | **Vitest**                                    | Native to the Vite ecosystem WXT sits on                                                                                                                                                                                                                                    |
| E2E tests           | **Playwright**                                | Loads the built extension in headed Chromium via persistent context. ⚠️ Note: MV3 extension testing has quirks (service workers, no headless in older versions) — follow Playwright's official "Chrome extensions" guide, don't invent flags                                |
| Lint/format         | ESLint + Prettier                             | Enforced in CI                                                                                                                                                                                                                                                              |
| CI                  | GitHub Actions                                | Free tier is enough: lint → typecheck → unit → build → e2e                                                                                                                                                                                                                  |
| Backend             | **None (MVP)**                                | All logic client-side. Cost: $0. Paid tier infra is a v2 decision                                                                                                                                                                                                           |

### Architecture

**Light monorepo (pnpm workspaces)** — justified because the phase engine should be reusable later (web app, mobile) and independently testable:

```
omahi/
├── packages/
│   └── core/                 # Pure TS, zero browser APIs
│       ├── src/
│       │   ├── phase-engine.ts     # date math → phase
│       │   ├── cycle-config.ts     # types, validation, defaults
│       │   ├── suggestions.ts      # phase → lifestyle content lookup
│       │   └── index.ts
│       └── tests/                  # Vitest, 100% pure-function coverage
├── apps/
│   └── extension/            # WXT app
│       ├── entrypoints/
│       │   ├── popup/              # dashboard UI
│       │   ├── newtab/             # new-tab page (reuses dashboard components)
│       │   └── background.ts
│       ├── components/
│       ├── hooks/                  # useCycleStorage, usePhase
│       ├── lib/storage.ts          # schema + versioned migrations
│       └── wxt.config.ts
├── e2e/                      # Playwright specs
├── docs/
│   ├── adr/                  # Architecture Decision Records (one per big choice)
│   └── phase-model.md        # the math, sourced
├── CLAUDE.md                 # AI context: conventions, commands, structure map
└── .github/workflows/ci.yml
```

**Principles**

- `packages/core` has **no browser imports** — pure functions, exhaustively unit-tested, deterministic (inject `today` as a parameter, never call `new Date()` inside logic).
- Storage schema is **versioned** (`schemaVersion` field) with a migration function from day one — cheap now, painful to retrofit.
- Every feature = one PR = one chunk below. Conventional Commits. PR template with Summary / Changes / Testing sections.
- `CLAUDE.md` documents: commands, folder map, naming conventions, testing strategy — so any AI session picks up context instantly.
- Naming: `camelCase` functions, `PascalCase` components, `kebab-case` files, domain terms (`phase`, `cycleDay`, `anchorDate`) used consistently.

### Cost & Scalability

- MVP running cost: **$0** (no backend, free CI tier, one-time $5 Chrome Web Store developer fee — approximate, verify current fee).
- Scales by design: core engine extractable to any future surface (PWA, mobile) without rewrite.
- Paid tier later: ExtensionPay or Paddle/LemonSqueezy are the usual no-backend options — **not verified here; research when v2 starts.**

---

## 5. Build Plan — PR-Sized Chunks

Each chunk = one standalone, independently testable PR.
**Naming:** branches use `<type>/<slug>` (`feat/core-phase-engine`); PR titles use Conventional Commits (`feat(core): cycle phase engine`). Each chunk below lists both.
**Per-chunk workflow:** implement → write tests → iterate until green → run agent as PR reviewer (prompt: _"Review this diff as a senior engineer: correctness, naming, test coverage, edge cases, docs"_) → address feedback → merge.

---

### Chunk 0 — Scaffolding ✅ Done

**Branch:** `chore/project-scaffolding` · **PR:** `chore: scaffold pnpm workspace, wxt extension, and ci`
**Scope:** pnpm workspace, WXT init in `apps/extension`, empty `packages/core`, TS strict, ESLint/Prettier, Vitest wired, Playwright wired with a smoke test that loads the unpacked build, GitHub Actions CI, `CLAUDE.md`, PR template.
**Test plan:**

- Unit: one trivial passing Vitest spec in core (guards the wiring)
- E2E: Playwright launches Chromium with the built extension, asserts popup opens and renders "Omahi"
- CI: pipeline green on the PR
  **Done when:** `pnpm dev`, `pnpm test`, `pnpm e2e`, `pnpm build` all work; CI green.

---

### Chunk 1 — Core Phase Engine (`packages/core`) ✅ Done

**Branch:** `feat/core-phase-engine` · **PR:** `feat(core): cycle phase engine and forecast`
**Scope:** `CycleConfig` type + validation; `getPhase(config, date)` → `{ phase, cycleDay, dayOfPhase, nextPhase, daysUntilNextPhase }`; `getForecast(config, fromDate, days)`; handles irregular inputs (cycle 21–40 days, period 2–8 days) and dates before anchor.
**Test plan (unit only — no UI yet):**

- Table-driven Vitest specs: every phase boundary for default 28/5 cycle
- Property-style checks: phases partition the cycle with no gaps/overlaps for cycle lengths 21–40
- Edge cases: anchor = today, date far past anchor (multi-cycle wraparound), invalid config throws typed errors
  **Done when:** 100% branch coverage on engine files; agent review passed.

---

### Chunk 2 — Storage Layer ✅ Done

**Branch:** `feat/storage-layer` · **PR:** `feat(extension): versioned storage layer with migrations`
**Scope:** `lib/storage.ts` in extension: schema v1 (`{ schemaVersion, cycleConfig, periodLog[] }`), get/set wrappers, migration scaffold, export/import JSON helpers.
**Test plan:**

- Unit: schema validation, migration from empty/v0 state, import rejects malformed JSON (Vitest with a mocked storage interface — keep the wrapper thin so mocking is honest)
- E2E: set config via storage in a Playwright session, reload, assert persistence
  **Done when:** round-trip persistence proven in e2e; agent review passed.

---

### Chunk 3 — Onboarding Flow ✅ Done

**Branch:** `feat/onboarding-flow` · **PR:** `feat(extension): first-run onboarding flow`
**Scope:** Popup first-run: welcome screen + 3-step form (last period date → cycle length → period length), validation, Omahi-voice copy, medical disclaimer, writes config via Chunk 2. Step 3 includes the new-tab opt-in toggle (persist the preference now; Chunk 9 consumes it).
**Design:** `Onboarding welcome` / `step 1` / `step 2` / `step 3` screens (§3) — inline calendar date picker with "Not sure" fallback, 21–40 stepper+slider, period-length pills, 3-dot progress.
**Test plan:**

- Unit: form validation logic
- E2E (Playwright): complete onboarding → dashboard appears; invalid inputs show errors; reopening popup skips onboarding
  **Done when:** e2e covers happy path + 2 error paths; agent review passed.

---

### Chunk 4 — Popup Dashboard ✅ Done

**Branch:** `feat/popup-dashboard` · **PR:** `feat(extension): phase-aware popup dashboard`
**Scope:** Current phase card (name, cycle day, phase color), today's focus sections (work / food / workout / rest) from core `suggestions`, days-until-next-phase.
**Design:** `Popup dashboard` screen (§3) — gradient header with calendar/settings nav, hero line + cycle-day circle, 4-segment phase progress bar, Work/Food/Move/Rest rows with phase-colored dots, "Today's nudge" tip card, "My period started →" link (stub until Chunk 7). Use the §3 phase color/tint tokens.
**Test plan:**

- Unit: `usePhase` hook with injected fake dates (menstrual/follicular/ovulation/luteal each render correct content)
- E2E: seed storage with configs placing "today" in each phase; assert dashboard text per phase
  **Done when:** all 4 phases visually verified via e2e; agent review passed.

---

### Chunk 5 — Suggestions Content Module ✅ Done (built before Chunk 4, which consumes it)

**Branch:** `feat/suggestions-content` · **PR:** `feat(core): per-phase suggestions content module`
**Scope:** Structured content in core (`suggestions.ts`), keyed by **`phase + dayOfPhase`** (not just phase) so late-luteal ≠ early-luteal and the app feels different every day:

- Per phase: base content for work / food / workout / rest-social
- Per `dayOfPhase`: a tip/variation layer; where a phase runs longer than authored days, clamp to the last authored day (never crash on long cycles)
- **Corpus generation:** written with an LLM at build time, human-reviewed by you before merge, shipped as static JSON — no runtime generation, no unreviewed health claims
- **Daily pick (meelio pattern):** deterministic pure function `getDailySuggestion(config, date)` — index derived from `(dayOfYear + userSeed) % variants`, `today` injected as a parameter; recomputed on every popup/new-tab open (no interval needed)
- Data files structured per-locale (`suggestions.en.json`) so v2 Urdu/Punjabi packs drop in without refactor

**Design:** seed copy from the `DCLogic` demo content in `Omahi UI.dc.html` (§3) — hero lines, work/food/move/rest text, and tips for all 4 phases already drafted in Omahi voice.
**Test plan:**

- Unit: every `phase × dayOfPhase` slot has complete, non-empty content; clamping works for 21–40 day cycles; picker is deterministic (same date+seed → same output) and covers all variants over consecutive days
- Manual: copy review checklist in PR — no unverified health claims, disclaimer intact
  **Done when:** content reviewed by you (product owner) before merge; agent review passed.

---

### Chunk 6 — Phase Calendar ✅ Done

**Branch:** `feat/phase-calendar` · **PR:** `feat(extension): month-view phase calendar`
**Scope:** Month grid in popup (or popup tab), phase color-coding via `getForecast`, predicted period days marked, prev/next month navigation.
**Design:** `Popup calendar` screen (§3) — phase-tinted day cells, today ringed with outline, predicted period days dashed, 5-item legend (4 phases + predicted period), "Log period start" CTA (stub until Chunk 7).
**Test plan:**

- Unit: month-grid date math (weeks, offsets, month boundaries)
- E2E: known config → assert specific dates carry specific phase colors; navigate months
  **Done when:** boundary dates (phase transitions, month edges) asserted in e2e; agent review passed.

---

### Chunk 7 — Manual Override / Period Logging ✅ Done

**Branch:** `feat/period-logging` · **PR:** `feat(extension): period logging and prediction re-anchoring`
**Scope:** "Period started today/on date X" action → appends to `periodLog`, re-anchors predictions; history list; undo last entry.
**Design:** entry points already placed in §3 screens — dashboard "My period started →" link and calendar "Log period start" button; wire both here.
**Test plan:**

- Unit: re-anchoring math (log earlier/later than predicted), undo restores prior state
- E2E: log a period → dashboard + calendar shift accordingly
  **Done when:** prediction shift verified end-to-end; agent review passed.

---

### Chunk 8 — Export / Import + Settings

**Branch:** `feat/settings-export-import` · **PR:** `feat(extension): settings view with json export/import`
**Scope:** Settings view: edit cycle config, export JSON (download), import JSON (file picker with validation), "delete all data".
**Anchor-precedence rule (decided in Chunk 7):** predictions use the LATEST of `cycleConfig.anchorDate` and all `periodLog` starts. So when settings saves a new "Last period started", it must also prune `periodLog` entries dated after the new anchor — otherwise the edit is silently overridden by a newer log entry.
**Design:** `Popup settings` screen (§3) — grouped rows: "My cycle" (anchor date / cycle length / period length), "New tab" toggle, "My data" (export / import / delete-all), privacy + disclaimer footer with version.
**Test plan:**

- Unit: import validation (reject wrong schema, wrong version handled by migration)
- E2E: export → wipe → import → state fully restored
  **Done when:** full backup round-trip green; agent review passed.

---

### Chunk 9 — New-Tab Page

**Branch:** `feat/newtab-page` · **PR:** `feat(extension): new-tab page with phase dashboard`
**Scope:** `entrypoints/newtab/`: full-page layout reusing dashboard components (phase card, today's focus) plus date/greeting; settings toggle to enable/disable the new-tab override (default: ask during onboarding — collected in Chunk 3's step 3); dark variant via `prefers-color-scheme` (light default); graceful empty state if onboarding incomplete.
**Design:** `New tab light` + `New tab dark` screens (§3) — time-of-day greeting hero, phase · day label, date + next-event line, 4 focus cards, phase progress bar with next-period date, settings gear. Dark tokens in §3.
**Test plan:**

- Unit: layout-level logic only (component reuse means phase logic is already covered)
- E2E: open a new tab in the Playwright session → assert Omahi page renders with correct phase; toggle off in settings → new tab no longer overridden (⚠️ verify how Playwright handles `chrome_url_overrides` — test approach may need iteration)
  **Done when:** new-tab renders per phase, toggle works end-to-end; agent review passed.

---

### Chunk 10 — Polish & Store Readiness

**Branch:** `chore/store-readiness` · **PR:** `chore: polish pass and chrome web store readiness`
**Scope:** Omahi voice pass on all copy, icons/branding (O-as-moon), empty/error states, a11y pass (labels, contrast, keyboard), store listing assets, privacy policy page (trivial since local-only), package trim (bundle only latin font subsets — the bare `@fontsource-variable` imports ship ~100 KB of unused cyrillic/vietnamese woff2).
**Design:** pull final icons/logos from the design project's `assets/icon/` (16–512 PNGs, SVGs) and `assets/logo/` (§3); brand rules in `Omahi Brand Guide.dc.html`. Verify screens match the design pixel-reasonably before store submission.
**Test plan:**

- E2E: full user journey (install → onboard → dashboard → calendar → log → export) as one smoke spec
- Manual: Lighthouse/axe accessibility check on popup
  **Done when:** smoke spec green; store package builds; agent review passed.

---

### v2 Chunks (scoped later, one-liners)

11. Weekly planner · 12. Best-day finder · 13. Google Calendar overlay (content script — needs its own e2e strategy) · 14. Notifications · 15. Luteal check-in · 16. Symptom logging · 17. Payments/licensing · 18. Urdu/Punjabi voice packs · 19. Firefox build

---

## 6. Decisions & Remaining Questions

### Decided (2026-07-02)

- **Browsers:** Chrome only at launch (Firefox = v2 chunk 19)
- **MVP surface:** popup + new-tab page (new-tab = Chunk 9)
- **Copy:** English only for v1 (Urdu/Punjabi voice packs = v2 chunk 18)

### Still open (confirm before relevant chunk)

1. **UI library:** React assumed — confirm before Chunk 0
2. **Phase model:** `cycleLength − 14` ovulation heuristic + 3-day window assumed — confirm before Chunk 1

---

## 7. Verification Log (things I did not fully verify — check before relying)

- WXT storage util exact API (`wxt/utils/storage`) — confirm in current WXT docs
- Playwright MV3 extension testing setup (incl. `chrome_url_overrides` new-tab behavior) — follow the official Playwright guide, flags change between versions
- Chrome Web Store fee (~$5 one-time) — approximate
- Payment providers for extensions (ExtensionPay/Paddle/LemonSqueezy) — unresearched, v2
- Clinical accuracy of the phase model — verify against a reputable source before finalizing in-app copy
