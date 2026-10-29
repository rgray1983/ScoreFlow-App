# Current ScoreFlow status

Updated: October 29, 2026. Repository: `rgray1983/ScoreFlow-App`.

## Resume here

Current release: **PR-040 / [GitHub PR #41](https://github.com/rgray1983/ScoreFlow-App/pull/41)**, approved and merged at `16333fcdd6fe6424315940cba3013b7ea1f75727` on October 29, 2026. Pro saved teams/rosters, family play-by-play, rolling chat, large general-call viewer graphics and individual viewer styles are merged. PR-039's durable recovery and optimized court asset remain intact.

## Next review

**PR-041** on `agent/pr-041-scoreboard-sounds`: Richie's seven supplied sounds, device-local sound controls on scorer/viewer, exact 4/7 run milestones, fresh-event playback and offline audio caching. See [PR-041](PRs/PR-041.md). Leave unmerged until approved.

## Phase 1 progress

| Feature | State |
| --- | --- |
| Serving mark and automatic side-out | Merged |
| Timeout lights and one-minute clock | Approved in PR-038 |
| Set-point / match-point atmosphere | Approved in PR-038 |
| Classic, Old School, and Flip Clock board styles | Approved in PR-038 |
| Quiet scorer display-name credit | Approved in PR-038 |
| Scoring-run warmth and 5+/7+ run treatment | Approved in PR-038 |
| Next-set / deciding-set card held until scorer continues | Approved in PR-038 |
| Ace / Kill / Block calls, one point each, undoable | Approved in PR-038 |
| White glow behind Match Results scores, preview and export | Approved in PR-038 |

## Next actions, in order

1. Review PR-041 on `agent/pr-041-scoreboard-sounds`; enable sound separately on scorer/viewer, check points, general calls, four/seven-point runs and timeouts. Exercise mute, Undo, reload, reconnect and offline scoring.
2. Validate on physical iPhone/Android installs and real gym Wi-Fi. Confirm safe areas, same-link recovery, one-minute timeouts, and results sharing. Browser and emulator tests are not physical-device evidence.
3. Measure and split the initial JavaScript payload in a focused follow-up. The oversized court image is addressed in PR-039; it now ships as a 198,582-byte precached WebP.
4. Add a separate staging Firebase project and branch preview site if sharing changes before merge becomes frequent. Keep production and staging data separate.
5. Only then choose from [later scoreboard ideas](SCOREBOARD_ADDON_IDEAS.md). Coach, billing, TV boards, and player statistics are separate work.

## Decisions to preserve

- Regular **+1** stays the primary courtside action.
- Highlights are presentation, not player statistics. Only Ace, Kill and Block award points; the roster drawer always scores for the selected home team.
- Only the scorer advances a set-break card; viewers wait.
- Pro rosters contain only player names and jersey numbers for optional scoring highlights. No Coach module, rotations, statistics, billing, or opponent roster.
- Keep the existing React/Vite/Firebase stack and GitHub Pages production deployment for now.
- Open review branches and keep matching PR records. Do not merge without Richie's approval.
