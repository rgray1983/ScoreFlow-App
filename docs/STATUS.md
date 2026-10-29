# Current ScoreFlow status

Updated: October 29, 2026. Repository: `rgray1983/ScoreFlow-App`.

## Resume here

Latest merged work on main: GitHub PR #38 / record PR-037, serving marks and two 45-second timeout lights per team per set.

Next review: **PR-038**, branch `agent/pr-038-phase-one-scoreboard`. See [the review record](PRs/PR-038.md). This branch implements the remaining [Phase 1 add-ons](PHASE_1_ADDONS.md) and adds isolated Firebase browser testing. It awaits Richie's phone testing and merge approval.

## Phase 1 progress

| Feature | State |
| --- | --- |
| Serving mark and automatic side-out | Merged |
| Timeout lights | Merged; one-minute clock update in PR-038 |
| Set-point / match-point atmosphere | Implemented in PR-038 |
| Classic, Old School, and Flip Clock board styles | Implemented in PR-038 |
| Quiet scorer display-name credit | Implemented in PR-038 |
| Scoring-run warmth and 5+/7+ run treatment | Implemented in PR-038 |
| Next-set / deciding-set card held until scorer continues | Implemented in PR-038 |
| Ace / Kill / Block calls, one point each, undoable | Implemented in PR-038 |

## Next actions, in order

1. Review PR-038 on an actual iPhone Home Screen install and Android browser. Check both orientations, the smallest phone, and a separate live viewer.
2. After approval, merge and confirm the Pages deployment. Check an existing installed PWA picks up the update and a viewer link survives a hard refresh.
3. Test poor gym connectivity: disconnect the scorer, score rallies, reconnect, reload, and confirm the same viewer link receives the latest score. Add explicit pending/offline indicators and durable resend handling before calling offline recovery complete.
4. Optimize the 8.5 MB court background and the initial JavaScript payload. Measure phone startup before and after; preserve visual quality and PWA caching.
5. Add a separate staging Firebase project and branch preview site if sharing changes before merge becomes frequent. Keep production and staging data separate.
6. Only then choose from [later scoreboard ideas](SCOREBOARD_ADDON_IDEAS.md). Coach, billing, TV boards, and player statistics are separate work.

## Decisions to preserve

- Regular **+1** stays the primary courtside action.
- Highlights are presentation, not player statistics.
- Only the scorer advances a set-break card; viewers wait.
- No Coach module or roster work in this pass.
- Keep the existing React/Vite/Firebase stack and GitHub Pages production deployment for now.
- Open review branches and keep matching PR records. Do not merge without Richie's approval.
