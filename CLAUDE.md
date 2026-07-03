# Omahi

Cycle-aware planning browser extension. Plans schedule, meals, workouts, and rest around the menstrual cycle's four phases. Chrome-only at launch, local-only storage (no server, no account). See `./omahi-plan.md` for the full product plan and build chunks.

## Commands (run from repo root)

| Command                                        | What it does                                           |
| ---------------------------------------------- | ------------------------------------------------------ |
| `pnpm dev`                                     | WXT dev server with HMR (loads extension in Chrome)    |
| `pnpm build`                                   | Production build → `apps/extension/.output/chrome-mv3` |
| `pnpm test`                                    | Vitest unit tests across all packages                  |
| `pnpm e2e`                                     | Playwright e2e (requires `pnpm build` first)           |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | ESLint / tsc / Prettier                                |

## Structure

```
packages/core/       # Pure TS cycle logic — NO browser APIs, ever
  src/               # phase-engine, cycle-config, suggestions (Chunks 1 & 5)
  tests/             # Vitest, table-driven, aim for 100% branch coverage
apps/extension/      # WXT app (React 19 + TypeScript strict)
  entrypoints/popup/ # dashboard UI
  entrypoints/newtab/# new-tab page (Chunk 9)
e2e/                 # Playwright specs; fixtures.ts loads the built extension
```

## Hard rules

- `packages/core` must stay free of browser imports. Pure functions only; inject `today: Date` as a parameter — never call `new Date()` inside logic.
- Storage schema is versioned (`schemaVersion`) with migrations from day one (Chunk 2).
- All health/lifestyle copy is suggestion, not medical advice — keep disclaimers intact.

## Conventions

- Naming: `camelCase` functions, `PascalCase` components, `kebab-case` files.
- Domain terms used consistently: `phase`, `cycleDay`, `anchorDate`, `cycleLength`, `periodLength`.
- Conventional Commits. One build-plan chunk = one PR.
- E2E: follow Playwright's official chrome-extensions guide (persistent context, extension id from service worker) — see `e2e/fixtures.ts`.

## Testing strategy

- Core logic: exhaustive unit tests in `packages/core/tests` (phase boundaries, irregular cycles 21–40 days, wraparound).
- UI: e2e via Playwright with seeded storage per phase; unit-test hooks with injected fake dates.
- CI (GitHub Actions): lint → format → typecheck → unit → build → e2e.
