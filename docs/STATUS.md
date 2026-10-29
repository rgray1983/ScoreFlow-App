# Current ScoreFlow status

Updated: October 29, 2026. Repository: `rgray1983/ScoreFlow-App`.

## Resume here

Current release: **PR-039 / [GitHub PR #40](https://github.com/rgray1983/ScoreFlow-App/pull/40)**, approved and merged at `88ae9e1205303d66fae555d0763b7342a59331b5` on October 29, 2026. It adds durable offline recovery, ownership/revision fences, pending status and the optimized cached court image. PR-038's one-minute timeouts, result-score glow and board styles remain intact.

## Next review

**PR-040** on `agent/pr-040-teams-play-by-play`: Pro saved teams and simple rosters, a scorer-side player → Ace/Kill/Block drawer, separate viewer Chat / Play by Play tabs, landscape fade-out announcements (including general team calls for either side), scorer landscape chat popups in the viewer position, and a rolling latest-message chat/reaction fix. See [PR-040](PRs/PR-040.md). Richie requested one PR for testing; leave it unmerged until approved.

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

1. Review PR-040 on `agent/pr-040-teams-play-by-play`; enable the existing Pro preview, create two teams and rosters, start a match, use the Roster drawer, and follow on a separate viewer. Exercise Undo, reconnect/reload, offline end, and a conversation with more than 40 messages. Keep this PR unmerged until Richie approves.
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
