# ScoreFlow Data Model

## Primary hierarchy

```text
Organization
└── Team
    └── Season
        ├── Roster Memberships
        │   └── Players
        ├── Schedule Events
        │   ├── Match
        │   ├── Practice
        │   ├── Tournament
        │   └── Team Event
        ├── Rotations
        ├── Match Events
        └── Reports
```

## Core entities

### Organization
Represents a school, club, or independent program. Owns branding, staff roles, teams, and organization-wide settings.

### Team
Represents Varsity, JV, 14U, 15U, 16U, or another competitive group. Stores team branding and default scoreboard settings.

### Season
Creates the time boundary for rosters, schedules, matches, practices, rotations, and reports.

### Player
A reusable person profile. A player joins a season through a roster membership rather than being duplicated for every season.

### Roster Membership
Connects a player to a team and season with jersey number, position, status, and season-specific details.

### Schedule Event
Shared event record for matches, practices, tournaments, and team events. Match and practice records extend this shared scheduling information.

### Match
A scheduled or unscheduled competition that can transition through draft, scheduled, live, completed, corrected, and archived states.

### Match Event
An append-oriented timeline entry such as point, kill, ace, error, substitution, timeout, rotation change, correction, note, or set winner.

## Design rule

Shared information is entered once and referenced throughout the platform. Starting a scheduled match must reuse the existing opponent, venue, date, team, season, and roster context.
