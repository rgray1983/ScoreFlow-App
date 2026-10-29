# Setup and architecture

## Assessment

The existing React + TypeScript + Vite + Zustand + Firebase PWA is a suitable foundation for this scoreboard. A framework or backend migration is not needed to finish Phase 1. Scoring already runs in a pure reducer and saves on-device before live publication. Both scorer and viewer now use the same parsed match state and visual-state helpers.

The useful improvements are repeatable tests, deliberate environment separation, reliable live updates, lighter assets, and an up-to-date project record.

## Development environments

| Environment | Command | Frontend | Data |
| --- | --- | --- | --- |
| Normal development | `npm run dev` | localhost:5173 | Existing production Firebase project |
| Isolated experimentation | `npm run dev:emulators` in one terminal, `npm run dev:test` in another | 127.0.0.1:5174 | Local `demo-scoreflow` Auth, Firestore, Storage |
| Automated browser tests | `npm run test:e2e` | Temporary server on 5174 | Temporary demo emulators, stopped after the run |
| Production | Approved merge to main | GitHub Pages | Existing Firebase project |

Use Node 22 LTS and Java 21. Install packages with `npm ci`; install Playwright Chromium with `npx playwright install chromium`. The first emulator run downloads its supporting runtimes. Stop interactive emulators before running the automated command, since both use ports 8080, 9099, and 9199.

`.env.e2e` selects emulators. Vite reads env files from the repository root. The emulator SDK wiring is guarded by `import.meta.env.DEV`, so a production build cannot use the test backend. A `demo-` Firebase project prevents a missing emulator from silently falling through to a real service. The browser-test fixtures also block and fail any attempted production Firebase request.

The frontend Firebase API key is public client configuration, not a server credential. Access is enforced by Firebase Auth and Firestore/Storage rules. Keep service-account credentials and billing secrets out of the frontend.

## Verification and deployment

Pull-request CI now runs unit tests, the TypeScript/production build, Firestore rules checks, and real browser tests through local emulators. The production Pages workflow still builds with `VITE_BASE=/ScoreFlow-App/`, creates the SPA fallback, and deploys only after a merge to main. E2E uses its own port and refuses to reuse a regular dev server.

GitHub Pages remains sufficient for the current static app. A preview deployment plus a separate staging Firebase project would make review on a phone easier, but should be a deliberate next setup task. Merely moving the frontend host would not fix live-sync bugs or separate test data.

## Reliability changes in PR-038

- Branding uploads update branding only. A delayed logo upload cannot replace scores, set-break state, momentum, or board style.
- Session/revision checks discard stale logo uploads after a newer upload or a session end.
- Points entered while initial live creation is in flight are published once the game is ready.
- Ordinary score updates no longer write `ended: false`, so a delayed score update cannot reopen an ended link.
- Rejected reducer commands do not write local storage or publish redundant updates.

## PR-039 review work

The next review branch implements a localStorage latest-state outbox with terminal pending ends and owner/revision-checked Firestore transactions. Retry starts on auth restoration, reconnect, focus, and a five-second interval. The scorer shows Pending sync until acknowledgement. Its optimized 198,582-byte court WebP is precached. See [PR-039](PRs/PR-039.md) for tests, constraints, and review commands. These changes are not deployed until approved.

## Previous baseline and remaining validation

The app saves the match on the device and keeps a recovery ID, but that is not a fully verified offline synchronization design. Firestore currently uses the default web cache; there is no app-level durable outbound queue or server-acknowledged pending indicator. Test disconnect/reconnect and reload explicitly before promising gym-proof recovery. Prefer a persisted latest-state outbox per live game and a clear pending indicator; keep score updates independent of slow media uploads. Persistent Firestore caching can complement that, with attention to shared devices and multiple tabs.

Other focused follow-ups:

- Compress/resize `images/scoreboard-bg.jpg` (about 8.5 MB). Its current size excludes it from the default PWA precache. Preserve the court art while reducing first-load transfer and making offline coverage deliberate.
- Split the initial JavaScript bundle (about 745 kB minified in this build) around infrequently used screens/account/graphics features. Keep live scoring fast.
- Retain a real-device checklist for iOS standalone mode, safe areas, Android, orientation, and two devices on gym Wi-Fi. Chromium emulation cannot establish that those work on physical devices.
- Keep `docs/STATUS.md` and PR records updated so work can resume without a specific chat.

## References

- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Connect Firestore to local emulators](https://firebase.google.com/docs/emulator-suite/connect_firestore)
- [Firestore offline behavior](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Vite static deployment](https://vite.dev/guide/static-deploy)
