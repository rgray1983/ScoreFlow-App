# ScoreFlow Coach Product Architecture

## Product pillars

### Program Management
Organizations, teams, seasons, coaches, settings, and branding. These are setup systems that change infrequently and will ultimately live under Settings or More.

### Roster Management
Player directory, active season roster, availability, injuries, attendance, tryouts, staff, roles, and permissions. Roster is the primary working module; Player Directory is supporting setup data.

### Daily Coaching
Schedule, practice planning, Live Match, rotations, and match notes. These workflows prioritize large touch targets, fast access, and minimal entry during play.

### Analytics
Match reports, player statistics, season statistics, trends, comparisons, and future AI insights.

## Connected player lifecycle

Recruit → Tryout → Evaluate → Select → Roster → Practice → Match → Statistics → Season Review

## Workflow rule

Every feature must solve the coach's workflow rather than exist as an isolated screen. Schedule feeds Live Match, Tryouts feed Roster, Roster feeds Practice and Live Match, and Live Match feeds Reports and season analytics.

## Interface rule

Management workspaces use dense, scan-first rows, shared context controls, and slide-over editing. Live coaching workspaces use larger controls, stronger contrast, and minimal interaction depth.
