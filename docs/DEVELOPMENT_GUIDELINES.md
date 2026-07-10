# ScoreFlow Development Guidelines

> These guidelines define how ScoreFlow is designed, developed, and maintained.
>
> The goal is not simply to build features, but to create the best volleyball scoring and coaching platform available while keeping the codebase clean, maintainable, and consistent.

---

# Core Philosophy

ScoreFlow is **not** just a scoreboard.

It is a complete volleyball ecosystem consisting of:

- Live Scoreboard
- Viewer Experience
- Fan Engagement
- Coach Tools
- Team Management
- Statistics
- Rotations
- Practice Planning
- Parent/Player Portal
- Future AI Coaching Tools

Every feature should support this vision.

---

# Development Rules

## Rule 1 — Only Change What Is Requested

Only modify the files and code required for the requested feature or bug fix.

Avoid unrelated refactors unless they are required to prevent bugs.

---

## Rule 2 — Always Clean Up

Whenever new code is added:

- Remove duplicate code.
- Remove obsolete listeners.
- Remove unused CSS.
- Remove dead functions.
- Remove conflicting logic.

Never stack hacks on top of old hacks.

Leave the codebase cleaner than you found it.

---

## Rule 3 — Inspect Before Changing

Never guess.

If behavior is unclear:

1. Inspect the existing code.
2. Understand why it behaves that way.
3. Make the smallest correct change.

Diagnosis comes before implementation.

---

## Rule 4 — Maintain a Consistent UI

Every screen should feel like ScoreFlow.

Maintain consistency in:

- Colors
- Typography
- Buttons
- Popups
- Animations
- Glass effects
- Shadows
- Icons
- Spacing
- Transitions

A user should immediately recognize the interface as ScoreFlow.

---

## Rule 5 — Mobile First

Every feature must be designed for:

- iPhone
- Android
- iPad

Desktop support is important, but mobile is the primary platform.

Landscape and portrait should both be considered.

---

## Rule 6 — Offline First

Volleyball gyms often have poor or nonexistent internet.

Every important action should:

1. Save locally first.
2. Sync automatically when connectivity returns.

Never assume internet access.

---

## Rule 7 — Performance Matters

Avoid unnecessary work.

Questions to ask:

- Does this listener need to exist?
- Can this update be event-driven?
- Is this animation efficient?
- Does this trigger unnecessary reflows?
- Does this affect battery life?

Smoothness is a feature.

---

## Rule 8 — Broadcast Quality

Every new feature should improve the viewing experience.

Ask:

> Does this make ScoreFlow feel more like ESPN?

If yes, pursue it.

If no, reconsider.

Broadcast quality includes:

- Live animations
- Tickers
- Score transitions
- Chat overlays
- Results graphics
- Viewer experience
- Visual polish

---

# User Experience First

Feature decisions should prioritize:

1. Simplicity
2. Speed
3. Reliability
4. Visual polish

Never add complexity unless it provides clear value.

---

# Feature Workflow

Every new feature follows this process:

1. Discuss the idea.
2. Design the user experience.
3. Determine affected files.
4. Implement only the required changes.
5. Test on real devices.
6. Fix edge cases.
7. Remove obsolete code.
8. Ship.

---

# Architecture Philosophy

ScoreFlow grows through independent modules.

Current architecture:

```text
ScoreFlow
│
├── Scoreboard
├── Live Viewer
├── Fan Zone
├── Broadcast Layer
├── Coach
├── Teams
├── Clubs
├── Players
├── Statistics
├── Rotations
├── Practice Planner
├── Parent Portal
├── Recruiting
└── AI Coach
```

Each module should be as self-contained as possible.

Avoid unnecessary coupling.

---

# Design Philosophy

ScoreFlow should feel:

- Modern
- Fast
- Professional
- Premium
- Broadcast-ready

The app should never feel cluttered or intimidating.

The interface should get out of the way so coaches can focus on volleyball.

---

# Product Vision

ScoreFlow is becoming the operating system for volleyball programs.

The goal is to provide everything a coach needs in one ecosystem:

- Live scoring
- Team management
- Player development
- Statistics
- Rotations
- Practice planning
- Parent engagement
- Broadcast-quality live viewing

One login.

One platform.

Everything volleyball.

---

# Guiding Principle

Whenever making a development decision, ask:

> Does this make ScoreFlow easier to use, more reliable, and more enjoyable for coaches, players, parents, and fans?

If the answer is yes, you're moving in the right direction.
