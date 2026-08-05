# Rotation Studio Formation Sequence Pivot

## Goal

Replace the experimental ghost start→move path editor with a formation-sequence creator aligned to ScoreFlow Coach product direction.

## Included

- Audit document at `docs/AUDIT_2026-08-05.md`
- Updated roadmap and Rotations feature docs
- `src/features/rotation-studio/` module:
  - typed RotationPlan / Formation model
  - perspective projection helpers
  - 4–2 / 5–1 / 6–2 template defaults
  - versioned persistence with safe discard of `scoreflow-rotation-studio-v2`
- Fullscreen Rotation Studio UI with:
  - system + real roster role assignment
  - R1–R6 rotations
  - Home / Receive / Attack / Serve / Defense / Left / Right formations
  - draggable players and ball
  - temporary preview ghosts/paths only during transitions
  - play sequence

## Out of scope here

- Completing PR-010 match lifecycle
- Full libero replacement workflow
- Hard overlap enforcement
- Reports / Tryouts / Settings
- Cloud sync

## Definition of done

A coach can create a team/season rotation plan, assign roster players to system roles, edit formation states on a perspective court, preview transitions, and reload without crashing on legacy ghost-path data.
