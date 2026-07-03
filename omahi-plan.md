# Omahi — Cycle-Aware Planning Browser Extension

> _O mahi, Love every phase._
> A browser extension that plans your schedule, meals, meetings, workouts, big tasks, and rest around your menstrual cycle's four phases.

---

## 1. Feature Set

### Must Have (MVP)

| #   | Feature                | Description                                                                         |
| --- | ---------------------- | ----------------------------------------------------------------------------------- |
| F1  | Cycle setup            | Last period date, cycle length, period length → auto-compute 4 phases               |
| F2  | Phase engine           | Pure logic: given config + date → phase, cycle day, days-until-next-phase, forecast |
| F3  | Popup dashboard        | Current phase, cycle day, today's focus (work mode, food, workout, rest)            |
| F4  | Daily suggestions      | Per-phase content pulled from the phase→lifestyle mapping (see §2)                  |
| F5  | Phase calendar         | Month view, color-coded phases, predicted period days                               |
| F6  | Manual override        | Log actual period start; corrections re-anchor predictions                          |
| F7  | Local-only storage     | `chrome.storage.local`, no server, no account                                       |
| F8  | Export / import        | JSON backup and restore                                                             |
| F9  | Omahi voice onboarding | Warm, mahiya-toned copy throughout (English-only for v1)                            |
| F10 | New-tab page           | Phase + today's plan on every new tab (toggleable in settings)                      |

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

## 3. Technical Specs

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

## 4. Build Plan — PR-Sized Chunks

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

### Chunk 3 — Onboarding Flow

**Branch:** `feat/onboarding-flow` · **PR:** `feat(extension): first-run onboarding flow`
**Scope:** Popup first-run: 3-step form (last period date → cycle length → period length), validation, Omahi-voice copy, medical disclaimer, writes config via Chunk 2.
**Test plan:**

- Unit: form validation logic
- E2E (Playwright): complete onboarding → dashboard appears; invalid inputs show errors; reopening popup skips onboarding
  **Done when:** e2e covers happy path + 2 error paths; agent review passed.

---

### Chunk 4 — Popup Dashboard

**Branch:** `feat/popup-dashboard` · **PR:** `feat(extension): phase-aware popup dashboard`
**Scope:** Current phase card (name, cycle day, phase color), today's focus sections (work / food / workout / rest) from core `suggestions`, days-until-next-phase.
**Test plan:**

- Unit: `usePhase` hook with injected fake dates (menstrual/follicular/ovulation/luteal each render correct content)
- E2E: seed storage with configs placing "today" in each phase; assert dashboard text per phase
  **Done when:** all 4 phases visually verified via e2e; agent review passed.

---

### Chunk 5 — Suggestions Content Module

**Branch:** `feat/suggestions-content` · **PR:** `feat(core): per-phase suggestions content module`
**Scope:** Structured content data in core (`suggestions.ts`): per phase — work mode, food guidance, workout intensity, rest/social note; 3–5 rotating daily tips per phase; deterministic rotation (seeded by date, testable).
**Test plan:**

- Unit: every phase has complete content (no empty fields); rotation is deterministic for a given date; copy contains no unverified health claims (manual review checklist in PR)
  **Done when:** content reviewed by you (product owner) before merge; agent review passed.

---

### Chunk 6 — Phase Calendar

**Branch:** `feat/phase-calendar` · **PR:** `feat(extension): month-view phase calendar`
**Scope:** Month grid in popup (or popup tab), phase color-coding via `getForecast`, predicted period days marked, prev/next month navigation.
**Test plan:**

- Unit: month-grid date math (weeks, offsets, month boundaries)
- E2E: known config → assert specific dates carry specific phase colors; navigate months
  **Done when:** boundary dates (phase transitions, month edges) asserted in e2e; agent review passed.

---

### Chunk 7 — Manual Override / Period Logging

**Branch:** `feat/period-logging` · **PR:** `feat(extension): period logging and prediction re-anchoring`
**Scope:** "Period started today/on date X" action → appends to `periodLog`, re-anchors predictions; history list; undo last entry.
**Test plan:**

- Unit: re-anchoring math (log earlier/later than predicted), undo restores prior state
- E2E: log a period → dashboard + calendar shift accordingly
  **Done when:** prediction shift verified end-to-end; agent review passed.

---

### Chunk 8 — Export / Import + Settings

**Branch:** `feat/settings-export-import` · **PR:** `feat(extension): settings view with json export/import`
**Scope:** Settings view: edit cycle config, export JSON (download), import JSON (file picker with validation), "delete all data".
**Test plan:**

- Unit: import validation (reject wrong schema, wrong version handled by migration)
- E2E: export → wipe → import → state fully restored
  **Done when:** full backup round-trip green; agent review passed.

---

### Chunk 9 — New-Tab Page

**Branch:** `feat/newtab-page` · **PR:** `feat(extension): new-tab page with phase dashboard`
**Scope:** `entrypoints/newtab/`: full-page layout reusing dashboard components (phase card, today's focus) plus date/greeting; settings toggle to enable/disable the new-tab override (default: ask during onboarding); graceful empty state if onboarding incomplete.
**Test plan:**

- Unit: layout-level logic only (component reuse means phase logic is already covered)
- E2E: open a new tab in the Playwright session → assert Omahi page renders with correct phase; toggle off in settings → new tab no longer overridden (⚠️ verify how Playwright handles `chrome_url_overrides` — test approach may need iteration)
  **Done when:** new-tab renders per phase, toggle works end-to-end; agent review passed.

---

### Chunk 10 — Polish & Store Readiness

**Branch:** `chore/store-readiness` · **PR:** `chore: polish pass and chrome web store readiness`
**Scope:** Omahi voice pass on all copy, icons/branding (O-as-moon), empty/error states, a11y pass (labels, contrast, keyboard), store listing assets, privacy policy page (trivial since local-only).
**Test plan:**

- E2E: full user journey (install → onboard → dashboard → calendar → log → export) as one smoke spec
- Manual: Lighthouse/axe accessibility check on popup
  **Done when:** smoke spec green; store package builds; agent review passed.

---

### v2 Chunks (scoped later, one-liners)

11. Weekly planner · 12. Best-day finder · 13. Google Calendar overlay (content script — needs its own e2e strategy) · 14. Notifications · 15. Luteal check-in · 16. Symptom logging · 17. Payments/licensing · 18. Urdu/Punjabi voice packs · 19. Firefox build

---

## 5. Decisions & Remaining Questions

### Decided (2026-07-02)

- **Browsers:** Chrome only at launch (Firefox = v2 chunk 19)
- **MVP surface:** popup + new-tab page (new-tab = Chunk 9)
- **Copy:** English only for v1 (Urdu/Punjabi voice packs = v2 chunk 18)

### Still open (confirm before relevant chunk)

1. **UI library:** React assumed — confirm before Chunk 0
2. **Phase model:** `cycleLength − 14` ovulation heuristic + 3-day window assumed — confirm before Chunk 1

---

## 6. Verification Log (things I did not fully verify — check before relying)

- WXT storage util exact API (`wxt/utils/storage`) — confirm in current WXT docs
- Playwright MV3 extension testing setup — follow the official Playwright guide, flags change between versions
- Chrome Web Store fee (~$5 one-time) — approximate
- Payment providers for extensions (ExtensionPay/Paddle/LemonSqueezy) — unresearched, v2
- Clinical accuracy of the phase model — verify against a reputable source before finalizing in-app copy
