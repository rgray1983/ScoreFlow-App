# ScoreFlow Scoreboard Rebuild

This is the implementation map for rebuilding the volleyball scoreboard in this repository.

Coach is a separate product in a separate repo. It is out of scope here. Do not add roster, rotations, stats, schedule, practice, or a Coach shell to this rebuild.

Update this file when a phase lands or when a locked decision changes. Do not start a rebuild PR until it maps to a phase below.

## Status

Phase 5 live share is in review. The current `index.html` / `app.js` app remains the live product. The Vite rebuild can create a live game, share `/g/:gameId`, and show viewer counts. Chat is still Phase 6.

## Why rebuild

The current app won a gym because it was fast to ship: start a match, tap points, share a link. That product is right.

The codebase is not. Scoring, live sync, history, Pro, chat, and results graphics share one 4,000-line script and duplicated portrait/landscape markup. The next feature is expensive, and Coach should not be folded back in to make it worse.

The rebuild keeps the same product and replaces the foundation.

## Locked decisions

| Decision | Choice |
|---|---|
| Product | Volleyball scoreboard + live viewer. Nothing else. |
| Language | TypeScript |
| App | Vite + React + React Router + Vite PWA |
| Styling | Keep the current ScoreFlow look. Tokens + CSS modules. Self-hosted Anton + Inter. Polish listed below — not a redesign. |
| Scoring | Pure TypeScript reducer with Vitest. No DOM. No Firebase. |
| State | Scoring reducer + a thin UI store (Zustand). |
| Backend | Same Firebase project: Auth, Firestore, Storage, later Functions |
| Hosting | Same as today until cutover, then the Vite production build |
| Payments | Not in the first rebuild. Pro may keep a clearly labeled Preview. |
| Native / App Store | Not now. PWA only. |
| Coach | Separate repo. This app may later expose a live game ID. That is all. |
| Local test | Checkout the PR branch, then run the rebuild on `http://localhost:5173`. Do not serve the current gym app locally. |

## Product boundary

### In scope (rebuild to parity, then polish)

- Home: saved home team, start a match, recent history, settings
- Home team setup: name, city/state, logo, color
- Match setup: title, format, home/visitor names and colors, start local or live
- Courtside scoreboard: one layout that reflows for portrait and landscape
- Volleyball rules: club 2-of-3, high school 3-of-5, deciding set to 15, win by 2
- Undo that can reverse the last point and a just-completed set
- Live share: unguessable game ID, viewer route, QR on-device, native share
- Viewer: read-only board, optional fan chat and reactions
- Match recovery if the scorer app is killed mid-live match
- Match history and a shareable results graphic
- Settings: theme, result backgrounds, optional signed-in cloud backup
- PWA install, splash, offline scoring

### Out of scope

- Coach Hub, roster, players, rotations, practice planner, schedule, stats, reports
- Switching between Scoreboard and Coach inside this app
- Timeouts, substitutions, libero, serving-team as a required v1 field (serve indicator can come after parity)
- NCAA / beach / custom formats (after the kernel exists they are cheap; do not block v1)
- Real payments / App Store
- Overlay / OBS mode
- Assistant scorer (two people writing the same live game)

If a request does not help a scorer run a volleyball match or a parent watch it, it does not belong in this rebuild.

## Target architecture

```text
src/
  scoring/          Pure match rules. Vitest lives here.
  live/             Firestore/Storage/Auth adapters. Game IDs. Presence.
  state/            UI store. Wires scoring + live + local persistence.
  ui/               Tokens, buttons, dialogs, score digits, toasts.
  screens/          Home, setup, match, viewer, history, settings.
  graphics/         Results PNG canvas.
  pwa/              Service worker registration, install, splash.
index.html
vite.config.ts
```

Rules:

- `scoring/` never imports React or Firebase.
- Screens never write Firestore documents by hand. They call `live/`.
- Portrait and landscape share one Match screen.
- Viewer is a route, not the scorer with buttons disabled.
- The current root `app.js` stays until Cutover. Do not port by copying functions into React one-for-one without going through `scoring/` and `live/`.

## Routes

| Route | Who | Purpose |
|---|---|---|
| `/` | Scorer | Home |
| `/team` | Scorer | Home team name, location, logo, color |
| `/setup` | Scorer | Match setup |
| `/match` | Scorer | Live scoring |
| `/g/:gameId` | Viewer | Read-only live board |
| `/history` | Scorer | Full match history |
| `/settings` | Scorer | Themes, graphics, backup, account |
| `/settings/themes` | Scorer | Theme picker |
| `/settings/graphics` | Scorer | Results backgrounds |

No `?mode=view`. Viewer identity is the route. Scorer identity is signed-in or anonymous Auth plus `ownerId` on the game.

## Scoring kernel

`src/scoring` is the first code that should exist. It owns:

- Match state: scores, sets, set number, format, completed sets, winner, undo stack
- Commands: `point(side)`, `undo()`, `newMatch()`, `applyFormat()`, `setNames()`, `setColors()`
- Queries: `isSetPoint`, `isMatchPoint`, `pointsToWin`, `canUndo`
- Formats:

```text
club        best of 3, sets to 25, deciding set to 15, win by 2, 2 sets to win
highschool  best of 5, sets to 25, deciding set to 15, win by 2, 3 sets to win
```

Required tests before any screen uses it:

- 24-24 then a point is not set win
- 25-23 is set win
- 24-25, point for trailing team, still in play
- Deciding set uses 15
- Match ends when sets-to-win is reached
- Undo restores the previous rally, including undoing a set that just completed
- A completed match rejects further points until `newMatch()`

Do not put logo bytes, Firebase, or React components in this package.

## Live game model

Keep the current Firebase project. Change the document shape as we port live share.

`volleyballGames/{gameId}`

- `gameId` is unguessable (do not use `game-${Date.now()}`)
- `ownerId` from `auth.currentUser.uid` after Auth is ready
- Scores, sets, names, colors, format, completed sets, `ended`
- Logo **URLs** only. Upload files to Firebase Storage.
- Point updates send the small score payload. Branding updates are separate.

Subcollections stay:

- `chat`
- `reactions`
- `presence`

Private data stays under `users/{uid}`: settings, saved home team, match history.

Anonymous Auth remains for gyms: scorer and viewer get a silent UID. Cloud backup still requires a real account.

## Look and feel

The current ScoreFlow look is the product. People already trust the dark arena, red brand, Anton scores, and home cards. The rebuild copies that visual language and polishes it. It does not become a new brand, a Coach dashboard, or a neon betting board.

### Keep

- Dark arena background `#080b12` with the existing red/blue gym-light wash
- Anton for scores and match titles; Inter for UI
- Brand red `#ff1414` / `#c70d13`
- Championship gold `#fbbf24` for live share, winner, and Pro — used like hardware, not as the default button
- Home/away team colors on the board only, as underglow and accents
- Rounded cards on Home/Settings; large score digits on Match
- Splash logo + volleyball
- PWA safe-area insets and 44px minimum tap targets

### Polish — sporty and professional

These are the upgrades. Apply them when the matching screen is ported, not as a separate “redesign phase.”

1. **Button hierarchy.** Today almost every pill is the same red. In the new app: red = start match and +1; gold = go live / share; quiet dark glass = secondary (Home, Settings, −1, Save). One loud action per screen.
2. **Scoreboard as a gym LED, Home as a product.** Match view is a black well, huge digits, thin court-line ticks, team-color glow behind each side. Home stays cards and copy. Do not put dashboard chrome, sidebars, or Coach navigation on the board.
3. **Broadcast live pill.** Replace the small Offline/Online chip with a real status: green dot + `LIVE`, muted `OFFLINE`, red `SYNC ERROR`. Portrait scoring shows the same pill and viewer count.
4. **Real icons, not emoji chrome.** Home, settings, share, undo, live, and close become a small SVG set. Keep emoji only for fan reactions.
5. **Typography discipline.** Uppercase tracked labels for SET, LIVE, FIRST TO 25. Anton only for scores and the match title. Body copy stays Inter and readable in a gym.
6. **Depth without glass everywhere.** Scoring surfaces stay solid and high-contrast. Glass/blur is for dialogs and sheets only, so points stay readable under gym lights.
7. **Motion is feedback, not a show.** Score pop 200–300ms. Set/match win can confetti. Honor `prefers-reduced-motion`. No slow page choreography before the first serve.
8. **Winner and results stay premium.** Trophy overlay and results graphic already feel like the shareable artifact. Keep them; make Share the one obvious next tap.
9. **Pro themes stay optional skins.** Classic is the default and must remain the gym-readable board. Neon/gold/ice themes cannot reduce contrast on scores.

### Do not

- Recolor the brand to Coach’s `#ef3340` / `#f4c95d` just because those tokens exist in old docs
- Use emoji for app chrome
- Make every button red
- Add court diagrams, rosters, or stat wheels to this scoreboard
- Copy a generic SaaS dashboard or a betting ticker

## UI rules for the new app

- One scoreboard layout. CSS reflows it. No second portrait markup tree.
- The score digits are display. `+1` is the primary hit target. `−1` is smaller. Undo is visible and larger than −1.
- Leaving a live match asks keep-live vs end-match.
- No native `confirm()` / `alert()`.
- Viewer allows pinch-zoom. Scorer can keep tap-manipulation.
- Honor `prefers-reduced-motion`.
- Visible `:focus-visible` rings.
- Compress PWA icons as part of the new shell. Do not copy the 2MB 512px PNG forward as-is.

## Migration rule

The gym app keeps shipping from the current root files until Cutover.

Each phase adds new code beside the old app, or ports one screen onto the new kernel, without breaking `index.html`.

Cutover is a dedicated phase: Vite becomes the production entry, then `app.js` and the old CSS are deleted.

## Local testing

Richie tests every rebuild PR locally before merge. The agent does not require production hosting for these phases.

The current gym app already runs from this repo as it does today. Do not start a second local server for `index.html` / `app.js`. Rebuild PRs only need the new Vite app (and tests).

Every rebuild PR and every agent message that expects local testing must include a **Run in VS Code** block that starts with fetching and checking out that PR's branch.

### Ports (locked)

| App | Command | URL |
|---|---|---|
| Rebuild (Vite) | `npm run dev -- --port 5173` | http://localhost:5173 |
| Scoring tests | `npm test` | terminal output |
| Firestore rules tests (unchanged) | `npm run test:firestore-rules` | emulator |

Until Cutover, `npm run dev` is the Vite rebuild on 5173. The gym scoreboard is still the existing `index.html` app in the repo.

### Run in VS Code — template

Replace `BRANCH` with the PR branch name. From the repo root in the VS Code terminal:

```bash
git restore package-lock.json package.json
git fetch origin
git checkout BRANCH
git pull origin BRANCH
npm install
npm test
npm run dev -- --port 5173
```

`git restore` discards local lockfile rewrites from the previous `npm install` (common on Node 24) so checkout is not blocked.

Then open http://localhost:5173 when the phase has UI to click.

## How we work

1. One phase per PR, named and recorded as `PR-###`.
2. The agent opens the PR. Richie checks out that branch, tests locally, asks for adjustments, then merges. Only then does the next phase start.
3. Every rebuild PR names its phase and includes a **Run in VS Code** block that starts with `git fetch` / `git checkout` of that branch.
4. If a phase needs a schema change, update this file and `docs/Architecture/Firebase Collections.md` in the same PR.
5. Test on a phone/iPad as well as the desktop preview when the UI exists. Gyms do not care that Vite is clean.
6. Do not “quickly” add a Coach link, roster, or stat button because it would be cool on the board.
7. Do not ask Richie to locally serve the current `index.html` app. That app stays in the repo until Cutover.

## Build order

Do these in order. Do not skip ahead to results graphics or Pro themes before Undo and live viewer work.

### Phase 0 — Plan (this document)

**Done when:** This file is the agreed map. Coach is out of scope. Look-and-feel and local-test ports are locked.

### Phase 1 — Toolchain + scoring kernel

First code phase.

- Add Vite, TypeScript, React, Vitest at the repo root without replacing the live app
- Vite `root` is `src/`, so production `index.html` is untouched
- Add `src/scoring` with the reducer and the tests listed above
- Add npm scripts: `dev`, `build`, `test`
- Leave `index.html` / `app.js` as the production scoreboard

**Done when:** `npm test` proves volleyball rules, including undo-through-set-win. The old app still opens as it does today. Richie has merged this phase.

### Phase 2 — App shell

- Vite `index` entry, router, tokens, PWA plugin
- Empty screens for the routes above
- Self-hosted fonts
- Compressed icons
- Service worker for the new shell only

**Done when:** `npm run dev` shows a ScoreFlow shell with working navigation and no scoring yet. Richie has merged this phase.

### Phase 3 — Home, home team, match setup

- Port Home Team setup (name, location, logo, color)
- Port match setup (title, format, names, colors)
- Persist home team locally
- Resize logos on upload before they are stored

**Done when:** A scorer can save a home team and start a local match into the new Match route, even if scoring is still crude. Richie has merged this phase.

### Phase 4 — Match screen

- One reflowing scoreboard
- Wired only through `scoring/`
- Visible Undo, +1, −1, New Match, Home
- Set point / match point banners
- No live Firebase yet

**Done when:** A full club or high-school match can be scored offline on phone and iPad, including undoing a set. Richie has merged this phase.

### Phase 5 — Live share + viewer

- Anonymous Auth before the first live write
- Create game with an unguessable ID
- Scorer URL stays `/match`; viewer is `/g/:gameId`
- On-device QR
- Presence / viewer count
- Recovery prompt if a live game is still open on this device
- Storage for logos, not data URLs in the game doc

**Done when:** A second phone on a viewer link tracks points in realtime, including set and match end. Richie has merged this phase.

### Phase 6 — Fan zone

- Chat + reactions on the viewer
- Scorer pause-chat control if it stays small
- Client cooldown plus rules that already exist; Functions throttle can wait

**Done when:** Viewer chat works on portrait and landscape without a second markup tree.

### Phase 7 — History + results graphic

- Save completed matches locally first
- History list and recap
- One-tap share/download of the results PNG
- Escape names in the UI (no raw `innerHTML` of team names)

**Done when:** After match point, the scorer can share a results image from the same overlay.

### Phase 8 — Settings, themes, account

- Settings routes
- Theme + background graphics
- Sign-in UI that actually exists in the HTML (email + Google; Apple when the domain is ready)
- Cloud backup only after a non-anonymous account
- Pro Preview labeled as preview until real billing exists

**Done when:** A signed-in user can backup history, and a guest still can score live.

### Phase 9 — Cutover

- Production hosting serves the Vite build
- Redirect or replace the old `app.js` entry
- Delete `app.js` and unused legacy CSS/HTML
- Keep Firestore rules tests green
- Add one Playwright (or similar) test: scorer point appears on viewer

**Done when:** The old tournament file is gone, and a live match still works on a hard refresh of the PWA.

## Later, after cutover (still scoreboard, still not Coach)

Only after Phase 9:

- Serving-team indicator
- Running set-score strip for viewers (25-18, 20-25, 8-7)
- Custom / NCAA / beach formats in `scoring/`
- Overlay viewer for livestreams
- Haptics on +1
- Real Pro billing
- Optional Capacitor wrapper if App Store discovery matters

Do not start these during Phases 1–9.

## Relationship to existing docs

This repo still contains Coach vision docs (`docs/ROADMAP.md`, `docs/Features/*`, `docs/Architecture/Routing.md`, and others). Treat those as historical / Coach-repo material.

For scoreboard work, this file wins. If a Coach-oriented doc disagrees with this rebuild, follow this rebuild.

## Next code PR

Phase 6: fan zone chat and reactions. Do not start Phase 6 until this phase is merged.
