# Scoreboard add-ons — Phase 1

The first wow pass on the ScoreFlow that already exists. Not the old rebuild phases. Gym screen, walk-up QR, overlay/TV, and the other later ideas stay in `SCOREBOARD_ADDON_IDEAS.md`.

Build these as scoreboard energy: fast on the scorer, loud on the viewer, undoable, live-synced.

## In this pass

| # | Add-on | Scorer | Viewer |
|---|---|---|---|
| 2 | Serving mark | Tap who serves to start a set; auto side-out after that | Same mark, no tap |
| 3 | Timeouts | Tap a team’s timeout lights | 45s popup + lights go down |
| 4 | Match-point atmosphere | Board shifts when the next point can win set/match | Same |
| 7 | Board themes | Pick a board skin (glass, Old School, flip-clock, …) | Follows the scorer’s skin |
| 9 | Scorer name | Uses Account display name | Quiet credit on the board |
| 10 | Run weather | Side heats up on a run | Same videogame heat |
| 11 | Set cards | Full-screen next-set / deciding-set card; **tap to continue** | Holds the card until scorer taps |
| 13 | Highlight calls | +1 stays; a Call control for Ace / Kill / … | Matching punch-in animation |

## 2 — Serving mark

Put it **under the team logo**: a small **Serving** pill, or a **pulsing volleyball**, or both (ball + quiet word).

- First serve of the match and of each new set is a tap on that team’s mark.
- After that, a point for the serving team keeps serve; a point for the other team flips it (side-out).
- Undo puts serve back too.
- Do not track who the server is. Only which team has the ball.
- Building on `cursor/serving-mark-feac` / `docs/PRs/PR-036.md`.

## 3 — Timeouts

Looks like a real board: **two lights per team per set**. Tap a light on the scorer to call it.

- Lights on that side go down.
- Viewer gets a **45 second timer popup** with the team name/color who called it.
- Scorer should see a compact timer too, and an **End timeout** (or it clears at 0) so they are not stuck.
- New set restores two lights each.
- Undo restores a light if the timeout was a mis-tap.
- Do not track substitutions. Do not pause the whole app in a way that blocks Undo.

## 4 — Match-point atmosphere

When the banner is SET POINT or MATCH POINT, the board **changes the room**: darker glass, scoring team’s color wash, digits breathe, thin gold rim. After the point (or an undo off the line) it snaps back.

If a highlight call (#13) happens on match point, play the punch animation **on top of** the atmosphere. Atmosphere is the persistent state; Ace/Kill is the hit.

## 7 — Themed scoreboards

A **board look** picker (Settings or a control on the match). This is not the current Themes page, which only retints brand red.

First skins to aim for:

- **Classic** — the glass court board we have now
- **Old School** — gym LED, fat digits, lamps, almost no chrome
- **Flip Clock** — realistic alarm-clock split flaps for the score

Home, Setup, Account, and Settings can stay ScoreFlow cards. Only the match + viewer board change. Live viewer follows the scorer’s skin so families see the same night.

## 9 — Scorer name

Account already has a display name (photo can come along if it fits). Place the name somewhere **quiet**: by the viewer count, or a small “Scored by …” under the ScoreFlow logo. It must not fight the digits.

If they have not set a name, show nothing — no empty “Scorer” chip.

## 10 — Run weather

Count consecutive points for one side.

- ~3 in a row: that half of the board warms
- ~5: hotter, a small RUN badge
- ~6–7+: videogame “on fire” without covering the score

A point the other way, or Undo, cools it immediately. This is momentum paint, not kills/digs/aces.

## 11 — Next-set and deciding-set cards

When a set ends and the match is **not** over:

- Full-screen card: **SET 2** (or 3 / 4 / 5), set score strip, maybe a short winner line
- If the next set is the decider: a different **DECIDING SET** card (gold, meaner)
- **Scorer must tap to continue.** Do not auto-advance. They may be talking to a ref.
- Viewer stays on the card until that tap, then both sides go to 0–0 on the new set
- Match-won keeps today’s trophy / Match Won / recap. Do not show a set card after the last set.

## 13 — Ace / Kill (and friends)

**+1 stays the primary score button.** Courtside cannot get slower.

Add one extra control that opens highlight calls, for example:

- Ace!
- Kill!
- Block! (if we want a third)

Each choice:

1. Awards the point to that team (same as +1)
2. Plays a **unique animation** on scorer and viewer (screen cracking, “KILL!” zooming at your face, etc.)
3. Can sit on top of run weather and match-point atmosphere

Do **not** save these as player stats, box scores, or roster events. Undo removes the point and the FX. If they only tap +1, it is a normal point with the existing pop / POINT banner.

Haptics on the scorer for +1 and for calls are welcome if the phone supports them.

## Out of this pass

Keep for later versions (see `SCOREBOARD_ADDON_IDEAS.md`):

- Gym screen / TV board link
- Walk-up QR on the scorer
- Live Story cards
- Team-color takeover of the whole app
- Viewer arena sound
- Fan reactions that hit the digits
- Pocket pings / Live Activities
- Pro paywall and App Store billing

## Product notes

- Live games must carry serve, timeouts remaining, timeout-clock, board theme, scorer name, run length, set-card state, and last highlight call so the viewer matches.
- Flavor never blocks the next +1 except the set card, which is an intentional pause.
- Still no Coach: no rotations, lineups, liberos, or stat sheets.
