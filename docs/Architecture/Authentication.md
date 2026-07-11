# Authentication and Roles

## Planned authentication

ScoreFlow Coach will use Firebase Authentication unless a later architecture decision replaces it.

## Planned roles

- Organization owner
- Head coach
- Assistant coach
- Statistician
- Team manager
- Parent viewer
- Player viewer

## Principles

- Permissions are organization- and team-aware.
- Coaches and staff receive only the access required by their role.
- Parent and player portals are read-only unless a specific workflow explicitly allows a response, such as availability.
- Public viewer data is separated from private coach notes, player contact fields, and staff-only analytics.
- Authentication must support installed PWAs and offline sessions without exposing unauthorized cached data.
- Role and permission changes are logged.
