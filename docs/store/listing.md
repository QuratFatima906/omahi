# Chrome Web Store listing — Omahi

## Name

Omahi — Cycle-Aware Planning

## Summary (132 chars max)

Plan work, meals, movement, and rest around your cycle's four phases. Private by design — everything stays on your device.

## Description

O mahi, love every phase.

Omahi turns your menstrual cycle into a planning superpower. Tell it three
things — when your last period started, your usual cycle length, and your
period length — and every day it shows you which of the four phases you're in
and how to plan around it:

🌊 Menstruation — reflective time, cozy food, gentle movement, high rest
🌱 Follicular — execution mode, lighter meals, climbing energy, say yes to plans
☀️ Ovulation — big meetings and pitches, your hardest workouts, most social days
🍂 Luteal — get organized, finish things, taper down, protect quiet time

WHAT YOU GET
• Popup dashboard: current phase, cycle day, and today's focus for work, food, movement, and rest — plus a daily nudge
• Phase calendar: your month, color-coded by phase, with predicted period days
• Period logging: log the real start date and predictions re-anchor instantly; undo any entry
• New-tab page (optional): your phase and today's plan on every new tab, light and dark
• Backup: export and import your data as JSON

PRIVATE BY DESIGN
No server. No account. No analytics. Your data lives in your browser and
nowhere else — export it, import it, or delete it any time.

AN HONEST NOTE
Phase timing is an estimate based on common heuristics, and real bodies vary.
Omahi's suggestions are lifestyle ideas, not medical advice.

## Category

Productivity

## Language

English

## Assets checklist

- [x] Icon 128×128 (`apps/extension/public/icon/128.png`, from the design project)
- [ ] Screenshots 1280×800 (popup dashboard ×4 phases, calendar, new tab light/dark) — capture from `pnpm build` output
- [ ] Small promo tile 440×280 (build from `assets/logo/omahi-badge-gradient.svg` in the design project)
- [x] Privacy policy (`docs/privacy-policy.md` — host or paste into the developer dashboard)

## Data-use disclosures (developer dashboard)

- Collects user data: **No** (all data stays local; nothing transmitted)
- Permissions justification: `storage` — persist the user's cycle configuration and preferences locally
