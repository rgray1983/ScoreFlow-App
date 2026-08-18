# Authentication and Roles

## Current Scoreboard authentication

The ScoreFlow scoreboard uses Firebase Authentication.

- Email and password sign-in remain available in the client.
- Google and Apple popup sign-in remain available in the client.
- Guest scorers and family viewers receive a silent Firebase Anonymous session so live sharing can stay signed-out in the UI while still having a stable UID for security rules.
- Anonymous sessions are not treated as cloud-backup accounts. Teams, match history, and premium settings only sync under `users/{uid}` after a non-anonymous sign-in.

## Current permissions

There are no organization or role documents in the live scoreboard database. Access is:

- Account owner for private `users/{uid}` data
- Game owner (`ownerId`) for live score writes
- Any authenticated session for fan-zone chat, reactions, and presence writes
- Anyone with the game ID for live score and fan-zone reads

## Planned Coach roles

ScoreFlow Coach will add organization-aware roles in a later Firebase implementation:

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
