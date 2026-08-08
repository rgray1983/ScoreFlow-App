# Repository split

ScoreFlow Coach was extracted from `rgray1983/ScoreFlow-App` into this dedicated repository.

## Boundary

| Repo | Owns |
|---|---|
| `ScoreFlow-Coach` (this repo) | Coach PWA, coach docs, coach roadmap |
| `ScoreFlow-App` | Live scoreboard / broadcast scoreboard |

## Shared later

Keep integrations as contracts, not by forcing a monorepo:

- team branding / colors
- match result payloads
- live viewer / share link IDs
- org and auth IDs when cloud sync arrives

## Source snapshot

Initial import came from the Coach subtree and `/docs` in ScoreFlow-App, including the Rotation Studio formation-sequence pivot work.
