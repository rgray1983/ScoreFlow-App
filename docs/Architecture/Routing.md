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

## Routing rules

- Routes remain usable as installed PWA deep links.
- Phone navigation prioritizes the most frequent actions and places secondary routes in More.
- iPad navigation may expose the complete primary route set.
- A route should not own data that belongs to another module; it reads shared entities through services and typed models.
- Route-level code splitting may be added when feature modules grow.
