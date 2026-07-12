# Live Match Hub

## Purpose

Bring independent scoreboard control, two-touch stat entry, current rotation, substitutions, timeouts, and the event timeline into one reliable courtside workflow.

## Match Mode

Live Match is a fullscreen execution mode rather than a normal management page.

- Sidebar, app header, and mobile navigation disappear
- A small Home control remains available in the upper-left corner
- Leaving Match Mode requires a deliberate Resume, Save & Exit, or Reset choice
- A browser fullscreen control is available when supported
- The score, court, and timeline persist locally through refreshes and accidental exits

## Court-first interaction

The active players are the stat interface.

- Tap the player where they are positioned on the court
- Tap the stat result
- The court rotates visually when the team rotates
- Bench players remain visible for substitutions
- Player location should support muscle memory during a match

The coach should never need to search a long player list while a match is active.

## Independent scoring and statistics

Score controls and statistics intentionally remain separate.

A recorded block, dig, attack, or serve does not automatically change the score. The scorer records the official point with the persistent Home and Away score controls after the whistle. This avoids incorrect assumptions about referee decisions, faults, overturned calls, and block touches that do not end the rally.

Both score changes and stat entries still appear in the shared timeline.

## Two-touch foundation

Initial actions include:

- Kill
- Attack error
- Ace
- Serve error
- Dig
- Block touch
- Solo block
- Assist
- Pass ratings 0–3

Advanced contact sequences, zones, assisted blocks, and linked actions remain future extensions of the same event model.

## iPad direction

- Full court and stat console visible together
- Compact persistent scoreboard
- Touch-first player selection
- Fast stat action grid
- Rotation, substitution, timeout, undo, and timeline controls
- Landscape is the primary match orientation

## Phone direction

- Persistent compact score strip
- Court remains the primary player selector
- Stat controls stack below the court in portrait
- Landscape retains the side-by-side match workspace where space permits

## Data principles

- Start from the active team, season, and scheduled match when available
- Save every important action locally first
- Record timeline events with unique IDs and timestamps
- Keep official scoring independent from statistical events
- Preserve the current score, rotation, court, bench, and timeline
- Continue operating without internet
