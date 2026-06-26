# ScoreFlow V2 Design Guidelines

## Goal

ScoreFlow V2 should feel like a polished sports app, not a patched scoreboard page. The UI should be card-based, dark, clean, and easy to scan quickly from a gym.

## Design principles

1. Use spacing, elevation, and typography instead of heavy outlines.
2. Use team colors only as accents.
3. Keep score numbers large and uncluttered.
4. Keep all layout rules in the correct section of `style.css`.
5. Avoid adding quick overrides at the bottom of the file.
6. Avoid `!important` unless there is no other option.

## Core tokens

Colors, spacing, radii, shadows, and typography are defined at the top of `style.css`.

Use these tokens instead of hard-coded one-off values:

- `--sf-bg`
- `--sf-card`
- `--sf-text`
- `--sf-muted`
- `--sf-gold`
- `--sf-home`
- `--sf-away`
- `--sf-radius`
- `--sf-shadow`

## Component sections

`style.css` is organized into:

1. Tokens
2. Reset + Viewport
3. Reusable Components
4. Screen States
5. Splash
6. Home Screen
7. Scoreboard Header
8. Scoreboard Landscape
9. Portrait Scorer + Portrait Viewer
10. Compact Landscape
11. Fan Zone
12. Dialogs + Settings
13. Overlays + Toasts + Recaps
14. Rotate Screen
15. Theme Hooks
16. Animations
17. Reduced Motion

Make future edits inside the matching section.
