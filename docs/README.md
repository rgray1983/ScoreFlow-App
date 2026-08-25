# ScoreFlow Documentation

This directory is the living source of truth for ScoreFlow product direction, architecture, interface rules, feature planning, and pull-request history.

## Working rule

Before starting a major feature PR, ask:

> Does this feature affect any future systems?

If yes, update the relevant documentation before implementation so the feature does not create conflicts with later modules.

## Scoreboard rebuild

This repository is the volleyball scoreboard. `SCOREBOARD_REBUILD.md` is the historical rebuild map (the app already shipped past a lot of it). New scoreboard work follows Richie plus the live app, then the add-on docs below. Coach is a separate product and is out of scope here.

## Scoreboard add-ons

- `PHASE_1_ADDONS.md` — the next wow pass we actually picked (serve, timeouts, match-point, board themes, scorer name, run weather, set cards, Ace/Kill)
- `SCOREBOARD_ADDON_IDEAS.md` — full idea list, including gym/TV ideas saved for later versions

## Sections

- `SCOREBOARD_REBUILD.md` — historical rebuild plan, stack, and phase order
- `Vision/` — product direction, milestones, and future ideas
- `Architecture/` — data model, Firebase, routing, authentication, and system boundaries
- `UI/` — design system and shared component rules
- `Features/` — living specifications for product modules
- `PRs/` — implementation records and testing checklists
