# ScoreFlow Coach

`ScoreFlow-Coach` is the dedicated home for the coach-facing ScoreFlow application.

## Technology

- React
- TypeScript
- Vite
- React Router
- Vite PWA

## Requirements

- Node.js 20.19 or newer
- npm

## Boundary

The existing ScoreFlow scoreboard remains in the repository root and is intentionally unchanged. Coach-specific pages, components, styles, PWA behavior, Firebase integration, and future modules stay inside this folder unless a later pull request explicitly defines shared code or a shared data contract.

## Local Development

From the `ScoreFlow-Coach` folder:

```bash
npm install
npm run dev
```

Use the local URL printed by Vite.

## Validation

```bash
npm run typecheck
npm run build
npm run preview
```

## Foundation Routes

- Home
- Teams
- Players
- Rosters
- Live Match
- Rotations
- Reports
- Settings

## Current State

This folder contains a responsive React dashboard shell, typed navigation, placeholder routes, and generated PWA support. It does not yet connect to Firebase or modify scoreboard data.
