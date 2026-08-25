# Firebase Collections

This document describes the collections the ScoreFlow scoreboard actually uses today, plus the planned Coach cloud model.

## Current scoreboard collections

### `users/{userId}`

Private signed-in account data. Not used by anonymous guest sessions.

Subcollections:

- `users/{userId}/settings/premium` — Pro preview flags, theme, graphics, and cloud-backup preference
- `users/{userId}/settings/profile` — scorer display name and avatar URL
- `users/{userId}/teams/{teamId}` — saved team profiles (`id`, `name`, `color`, `logo`, `favorite`, `updatedAtMs`)
- `users/{userId}/matches/{matchId}` — match history (`title`, team names/logos, set scores, winner, format, `completedSets`, `updatedAtMs`)

Queries: `orderBy("updatedAtMs", "desc")` with a limit. Security rules allow only the authenticated owner.

### `volleyballGames/{gameId}`

Live shared scoreboard document created when a scorer starts a live match. Family viewer links read this document by ID. Listing the collection is denied.

Fields include public scoreboard state (`homeScore`, `awayScore`, set counts, names, colors, `servingSide`, logo **URLs**, `ended`) plus `ownerId` for the creating scorer. Live games may also store `scorerName` and `scorerAvatar` so a later viewer badge can show who’s scoring. `servingSide` is `"home"`, `"away"`, or empty when the next set still needs a first-serve tap. Game IDs are unguessable 128-bit hex strings. Logo and avatar bytes are stored in Firebase Storage under `volleyballGames/{gameId}/` or `users/{userId}/`, not as huge data URLs in the game document.

Subcollections:

- `chat/{messageId}` — fan chat (`text`, `name`, `role`, `sessionId`, `uid`, timestamps)
- `reactions/{reactionId}` — emoji reactions (`emoji`, `uid`, timestamps)
- `presence/{uid}` — live viewer/scorer heartbeat (`role`, `uid`, timestamps)

The live game document may include `chatPaused` so the scorer can pause viewer chat without ending the match.

Reads of a known game and its fan-zone subcollections are public so viewer links work. Writes require authentication. Only `ownerId` can change the live score document.

## Planned Coach collections

These are not implemented in Firestore yet and remain denied by default:

- `organizations`
- `teams`
- `seasons`
- `players`
- `rosterMemberships`
- `scheduleEvents`
- `matches`
- `matchEvents`
- `rotations`
- `practicePlans`
- `reports`
- `syncOperations`

## Key principles

- Every live game stores an `ownerId`.
- Private account records stay under `users/{uid}`.
- Match events in the future Coach product should stay append-oriented.
- Offline actions receive a client-generated ID before synchronization.
- Security rules default to deny and never use an expiration date.

## Local-first relationship

Firebase is the shared cloud source for live viewer links and optional signed-in backup. Scoring, teams, and history still save locally first.
