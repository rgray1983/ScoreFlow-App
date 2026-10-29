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

## Live recovery baseline (merged PR-039)

A versioned localStorage latest-state outbox stores complete live scores and terminal pending ends. Owner/revision-checked Firestore transactions prevent older writes from rolling back scores or reopening ended games. Retry runs on auth restoration, reconnect, focus, and a five-second interval. Pending / Offline / Online status reflects the queue. The optimized 198,582-byte court WebP is precached. See [PR-039](PRs/PR-039.md).

## Pro teams and family play-by-play (PR-040 review)

Use the existing **Try Pro** preview switch on Home; no billing or entitlement service was added. **Manage Teams & Rosters** saves a team name, city/state, color, logo, and an optional roster (name and jersey number). Match Setup's **Your saved team** selects the home side; the opponent still uses ordinary setup. Free keeps its single Home Team and normal scoring.

Profiles and rosters are saved **on this browser/device** in `scoreflowTeamsV1`. The existing Home Team is migrated on read without losing branding. These extra profiles/rosters do not yet sync between devices; existing cloud match/profile backup behavior is unchanged. A `scoreflowMatchContextV1` snapshot freezes the match's branding and roster independently of the next setup draft. Editing/selecting another team does not alter an ongoing match.

In the scorer, **Roster → player → Ace / Kill / Block** awards exactly one home point, closes the drawer and records a player announcement. +1 remains the primary action. The normal team-only Call buttons remain available. No opponent lineup, coaching statistics or non-scoring actions are introduced. Undo reverses the scored action and removes its announcement.

The player feed is derived from surviving undo-history highlights, including their player and set/score snapshot. It is included in the same versioned live outbox/game transaction as the score, so coalesced offline updates retain every surviving highlight, retries cannot duplicate entries, and an offline terminal end retains its feed. Full rosters are not published: only the players explicitly announced appear on the public viewer link. This does not add a separate message write or new production rules.

Portrait viewers use **Chat / Play by Play** tabs; landscape viewers see fresh announcements fade away like chat. Freshness/seen-ID guards prevent history replay, and Undo removes an active play popup. Chat and reactions now listen to the **latest** bounded window, rather than getting stuck on the first 40/60 entries. Chat can load older pages with a timestamp + document-ID cursor, preserving tied timestamps and deduplicating overlaps. Limits bound subscription reads, not how many messages a match can accept. No automatic chat retention/deletion policy is added.

Review commands and scenarios: [PR-040](PRs/PR-040.md). Browser tests use `demo-scoreflow` emulators and block production Firebase requests. No production Firebase data, auth, rules or hosting settings are changed.

## Remaining validation

- Check physical iPhone/Android installs, safe areas, orientation and two devices on real gym Wi-Fi. Chromium emulation is not physical-device evidence.
- Team/roster cross-device backup is not included in PR-040. Keep browser storage intact; the live outbox likewise requires local storage and an existing authenticated identity for offline recovery.
- The initial JavaScript payload still needs a separate measured code-splitting pass; keep the complete scoring/recovery flow available offline.
- A dedicated staging Firebase project and preview host would allow safer shared phone testing before merge.

## References

- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Connect Firestore to local emulators](https://firebase.google.com/docs/emulator-suite/connect_firestore)
- [Firestore offline behavior](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Vite static deployment](https://vite.dev/guide/static-deploy)
