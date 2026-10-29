# ScoreFlow Live

Mobile-first volleyball scoreboard, live family viewer, Fan Zone, and shareable match results. React + TypeScript + Vite, Zustand, Firebase, and an installable PWA.

**Resuming work? Start with [current status](docs/STATUS.md), [the Phase 1 spec](docs/PHASE_1_ADDONS.md), and [the PR workflow](docs/PRs/README.md).** The repository is the project record; a chat is not required to continue.

## Run locally

Use Node 22 LTS and `npm ci` from the repo root.

```bash
npm ci
npm run dev
```

Open http://localhost:5173. Regular development uses the existing Firebase project. To keep experimentation entirely local, use the emulator workflow in [SETUP.md](docs/SETUP.md).

## Verify changes

```bash
npm test
npm run build
npm run test:firestore-rules
npx playwright install chromium
npm run test:e2e
```

Browser tests need Java 21 and use local Auth, Firestore, and Storage emulators with the `demo-scoreflow` project. The test server is http://127.0.0.1:5174, separate from your normal development server. No Firebase login is needed for the demo emulators.

## Release

Work on a numbered `agent/pr-###-description` branch, add `docs/PRs/PR-###.md`, and open a pull request. Richie tests and approves before merging. Main builds and deploys to [GitHub Pages](https://rgray1983.github.io/ScoreFlow-App/). Keep Pages set to **GitHub Actions**.

See [setup and architecture recommendations](docs/SETUP.md). The current work is the scoreboard experience; Coach remains outside this pass.
