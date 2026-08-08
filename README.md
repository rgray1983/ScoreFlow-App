# ScoreFlow Coach

Volleyball coaching operating system — mobile- and iPad-first.

ScoreFlow Coach helps coaches manage organizations, teams, seasons, players, rosters, schedules, practices, live matches, rotations, and reports.

This repository was split out of [`rgray1983/ScoreFlow-App`](https://github.com/rgray1983/ScoreFlow-App). The live scoreboard remains in that repo. Coach is developed here.

## Stack

- React
- TypeScript
- Vite
- React Router
- Vite PWA
- Local workspace persistence

## Requirements

- Node.js 20.19 or newer
- npm

## Local development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run typecheck
npm run build
npm run preview
```

## Preferred viewport

- Primary: `1180 × 820` (iPad landscape)
- Also test: `820 × 1180`, `390 × 844`, `844 × 390`

## Docs

Product direction, roadmap, architecture, and feature specs live under [`docs/`](./docs).

Start with:

- [`docs/AUDIT_2026-08-05.md`](./docs/AUDIT_2026-08-05.md)
- [`docs/ROADMAP.md`](./docs/ROADMAP.md)
- [`docs/Features/Rotations.md`](./docs/Features/Rotations.md)
- [`docs/Features/Live Match.md`](./docs/Features/Live%20Match.md)

## Related

- Scoreboard / broadcast app: https://github.com/rgray1983/ScoreFlow-App
