# Current ScoreFlow status

Updated: October 29, 2026. Repository: `rgray1983/ScoreFlow-App`.

## Resume here

Current release: **PR-038 / [GitHub PR #39](https://github.com/rgray1983/ScoreFlow-App/pull/39)**, approved by Richie on October 29, 2026. It completes the [Phase 1 add-ons](PHASE_1_ADDONS.md), changes timeouts to one minute, adds white score glow to recap/export graphics, and isolates Firebase browser testing. GitHub tracks the merge and Pages deployment state; see [the review record](PRs/PR-038.md) for details.

## Next review

PR-039 on `agent/pr-039-offline-recovery` adds durable offline score/end recovery, owner/revision fences, pending sync status, and a 97.7% smaller cached court image. See [PR-039](PRs/PR-039.md). All changes are in one review PR; keep it unmerged until Richie approves. The initial JS bundle and real-device/gym validation remain follow-ups.

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

1. Review PR-039 on `agent/pr-039-offline-recovery`; use its command block and exercise scorer disconnect/reload/reconnect, offline end, account changes and replacement matches. Keep it unmerged until Richie approves.
2. Validate on physical iPhone/Android installs and real gym Wi-Fi. Confirm safe areas, same-link recovery, one-minute timeouts, and results sharing. Browser and emulator tests are not physical-device evidence.
3. Measure and split the initial JavaScript payload in a focused follow-up. The oversized court image is addressed in PR-039; it now ships as a 198,582-byte precached WebP.
4. Add a separate staging Firebase project and branch preview site if sharing changes before merge becomes frequent. Keep production and staging data separate.
5. Only then choose from [later scoreboard ideas](SCOREBOARD_ADDON_IDEAS.md). Coach, billing, TV boards, and player statistics are separate work.

## Decisions to preserve

- Regular **+1** stays the primary courtside action.
- Highlights are presentation, not player statistics.
- Only the scorer advances a set-break card; viewers wait.
- No Coach module or roster work in this pass.
- Keep the existing React/Vite/Firebase stack and GitHub Pages production deployment for now.
- Open review branches and keep matching PR records. Do not merge without Richie's approval.
