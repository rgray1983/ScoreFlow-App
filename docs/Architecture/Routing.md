# ScoreFlow Coach Routing

## Primary routes

- `/` — Coach Hub
- `/schedule` — schedule and calendar
- `/teams` — organizations and teams
- `/seasons` — season management
- `/players` — player profiles
- `/rosters` — season roster management
- `/live-match` — live match hub
- `/rotations` — rotation creator and library
- `/reports` — match, team, season, and player reports
- `/settings` — organization, team, account, and app settings

## Planned navigation consolidation

Teams, seasons, and the player directory are setup-oriented tools that change less often than schedule, roster, match, rotation, and reporting workflows. Once Settings and the working Roster module can expose these tools without dead ends, the primary navigation should prioritize daily coaching work:

- Hub
- Schedule
- Roster
- Live
- Rotations
- Reports
- More

Program setup and the player directory will then move under Settings or More while retaining their routes for deep linking and direct access.

The Roster route remains a primary daily workspace because availability, injuries, starters, lineups, and match preparation change throughout a season.

## Routing rules

- Routes remain usable as installed PWA deep links.
- Phone navigation prioritizes the most frequent actions and places secondary routes in More.
- iPad navigation may expose the complete primary route set.
- A route should not own data that belongs to another module; it reads shared entities through services and typed models.
- Route-level code splitting may be added when feature modules grow.
