# ScoreFlow Coach Roadmap

Updated after the 2026-08-05 audit of `agent/pr-010-match-lifecycle`.  
See `docs/AUDIT_2026-08-05.md` for the full status matrix.

## Active priority order

1. Stabilize the current PR-010 branch
2. Rebuild Rotation Studio as a formation-sequence creator
3. Complete remaining PR-010 match lifecycle pieces
4. Finish match persistence and full state-snapshot Undo
5. Build Match Summary
6. Build Reports from permanent match events
7. Add Tryouts
8. Finish Settings and administration
9. Add team-sharing / player-view workflows
10. Final PWA polish, offline behavior, accessibility, and release readiness

## Phase status

### Done — Product foundation and daily coach tools

- PR workflow and repository rules
- React / TypeScript / Vite / PWA foundation
- Mobile/iPad-first design system and Coach Hub
- Organizations, Teams, Seasons
- Players, Rosters, Team HQ
- Schedule foundation
- Practice planner
- Live Match court, score, radial stat wheel, timeline shell
- Match Setup UI and drag substitutions (PR-010 partial)

### In progress — Rotation Studio pivot

Replace the experimental ghost-path editor with:

- Rotation Plan + system type
- Real roster role assignments
- Per-rotation formation states (Home, Receive, Attack, Serve, Defense, Left, Right)
- Perspective court with logical coordinates
- Ball position per formation
- Preview transitions between saved formations
- Versioned persistence integrated with team/season context

### Next — Complete PR-010 match lifecycle

- Real set and match completion rules
- Set Complete overlay and next-set transition
- Deciding set behavior
- Set-by-set and match result persistence
- Full snapshot Undo
- Serve-aware rotation
- Libero replacement workflow
- Schedule event completion
- Reopen completed matches
- Match summary
- Permanent event records for Reports

### Later

- Reports and season analytics
- Tryouts (QR signup → evaluation → convert to player)
- Settings / branding / defaults
- Team portal sharing
- Offline sync engine
- Advanced analytics and AI assists

## Design constraints that stay fixed

- Mobile and iPad first; preferred viewport `1180×820`
- Dark premium frosted-glass ScoreFlow identity
- Score and stats remain independent in Live Match
- Players page owns profiles; Roster owns lineup/roles
- Do not prematurely redesign as generic SaaS
- Keep build green after every major change

## Planning rule

Before beginning a major feature PR, document its effect on future systems, shared entities, offline behavior, permissions, and mobile/iPad workflows.
