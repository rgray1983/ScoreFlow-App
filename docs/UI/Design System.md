# ScoreFlow Coach Design System

## Direction

ScoreFlow Coach is dark, premium, bold, and sports-focused without becoming cluttered or resembling a betting product.

## Core interface principles

- Mobile and iPad first
- Important controls remain inside the viewport
- Thumb-friendly tap targets
- Clear red and gold action hierarchy
- Dense information without tiny unreadable text
- Cards organize work, not decoration
- Motion supports feedback and never slows match entry
- Safe-area support for installed iPhone and iPad PWAs

## Workspace density

ScoreFlow uses two deliberate interface densities:

### Management data

Organizations, teams, seasons, player directories, and similar setup records use compact rows, restrained surfaces, and scan-friendly metadata. These screens are optimized for occasional editing and efficient review rather than visual presentation.

### Live coaching data

Matches, rotations, practice activity, statistics, and other in-session tools use larger controls, stronger hierarchy, and more breathing room. These screens are optimized for fast decisions, clear feedback, and touch use during coaching.

Do not use decorative profile cards when a compact management row communicates the same information more efficiently.

## Current color tokens

- Background: `#08090d`
- Elevated background: `#0f1117`
- Panel: dark translucent charcoal
- Primary action red: `#ef3340`
- Secondary highlight gold: `#f4c95d`
- Success green: `#3ddc84`
- Information blue: `#5d9df5`
- Primary text: `#f7f8fb`
- Muted text: `#8e96a6`

## Team-aware colors

- Captain designations use ScoreFlow gold.
- Libero designations use the active team's secondary color.
- Starter designations may use a restrained version of the active team's primary color.
- Availability and status colors remain separate from team-role colors.
- Status must always include readable text and never depend on color alone.

## Viewport rules

- The outer application frame uses `100dvh`.
- The document body does not become the main scrolling surface.
- Navigation and critical actions remain fixed or predictably reachable.
- Route content may scroll inside its assigned viewport.
- Short landscape layouts receive deliberate compression rules rather than accidental clipping.
- Text that carries essential meaning must not be truncated merely to preserve a rigid card grid.

## Accessibility

- Visible keyboard focus
- Adequate contrast
- Text alternatives for icons
- Reduced-motion support
- Minimum practical touch targets
- Status must not depend on color alone
