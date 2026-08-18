# ScoreFlow Documentation

This directory is the living source of truth for ScoreFlow product direction, architecture, interface rules, feature planning, and pull-request history.

## Working rule

Before starting a major feature PR, ask:

> Does this feature affect any future systems?

If yes, update the relevant documentation before implementation so the feature does not create conflicts with later modules.

## Scoreboard rebuild

This repository is the volleyball scoreboard. The implementation map is `SCOREBOARD_REBUILD.md`. Scoreboard work follows that file. Coach is a separate product and is out of scope here.

## Sections

- `SCOREBOARD_REBUILD.md` — scoreboard rebuild plan, stack, and phase order
- `Vision/` — product direction, milestones, and future ideas
- `Architecture/` — data model, Firebase, routing, authentication, and system boundaries
- `UI/` — design system and shared component rules
- `Features/` — living specifications for product modules
- `PRs/` — implementation records and testing checklists
