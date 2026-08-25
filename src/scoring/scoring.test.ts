import { describe, expect, it } from "vitest";
import {
  applyFormat,
  canUndo,
  createMatch,
  isMatchOver,
  isMatchPoint,
  isServing,
  isSetPoint,
  matchBanner,
  newMatch,
  point,
  pointsToWin,
  setColors,
  setNames,
  setServe,
  subtract,
  undo
} from "./index";
import type { MatchEngine, Side } from "./types";

function rallyTo(engine: MatchEngine, home: number, away: number): MatchEngine {
  let next = engine;
  while (next.match.homeScore < home || next.match.awayScore < away) {
    if (next.match.homeScore < home) next = point(next, "home");
    if (isMatchOver(next.match) || next.match.setNumber !== engine.match.setNumber) break;
    if (next.match.awayScore < away) next = point(next, "away");
    if (isMatchOver(next.match) || next.match.setNumber !== engine.match.setNumber) break;
  }
  return next;
}

function winSet(engine: MatchEngine, side: Side): MatchEngine {
  const beforeSet = engine.match.setNumber;
  let next = engine;
  const homeTarget = side === "home" ? 25 : 0;
  const awayTarget = side === "away" ? 25 : 0;
  next = rallyTo(next, Math.max(homeTarget, next.match.homeScore), Math.max(awayTarget, next.match.awayScore));
  while (next.match.setNumber === beforeSet && !isMatchOver(next.match)) {
    next = point(next, side);
  }
  return next;
}

describe("club format", () => {
  it("uses best of 3, 25-point sets, and 2 sets to win", () => {
    const { match } = createMatch();
    expect(match.matchFormat).toBe("club");
    expect(match.matchSets).toBe(3);
    expect(match.setsToWin).toBe(2);
    expect(match.winBy).toBe(2);
    expect(pointsToWin(match)).toBe(25);
  });
});

describe("set win rules", () => {
  it("does not award the set at 24-24 after one more point", () => {
    const tied = rallyTo(createMatch(), 24, 24);
    expect(tied.match.homeScore).toBe(24);
    expect(tied.match.awayScore).toBe(24);
    expect(tied.match.homeSets).toBe(0);
    expect(isSetPoint(tied.match, "home")).toBe(false);

    const extra = point(tied, "home");
    expect(extra.match.homeScore).toBe(25);
    expect(extra.match.awayScore).toBe(24);
    expect(extra.match.homeSets).toBe(0);
    expect(extra.match.setNumber).toBe(1);
    expect(extra.match.winner).toBe("");
    expect(isSetPoint(extra.match, "home")).toBe(true);
  });

  it("awards the set at 25-23", () => {
    const late = rallyTo(createMatch(), 24, 23);
    expect(isSetPoint(late.match, "home")).toBe(true);

    const won = point(late, "home");
    expect(won.match.homeSets).toBe(1);
    expect(won.match.awaySets).toBe(0);
    expect(won.match.setNumber).toBe(2);
    expect(won.match.homeScore).toBe(0);
    expect(won.match.awayScore).toBe(0);
    expect(won.match.servingSide).toBe("");
    expect(won.match.completedSets).toEqual([
      { set: 1, homeScore: 25, awayScore: 23, winner: "home" }
    ]);
  });

  it("stays in play when the trailing team scores at 24-25", () => {
    const late = rallyTo(createMatch(), 24, 25);
    expect(late.match.homeScore).toBe(24);
    expect(late.match.awayScore).toBe(25);
    expect(isSetPoint(late.match, "away")).toBe(true);

    const catchUp = point(late, "home");
    expect(catchUp.match.homeScore).toBe(25);
    expect(catchUp.match.awayScore).toBe(25);
    expect(catchUp.match.homeSets).toBe(0);
    expect(catchUp.match.setNumber).toBe(1);
  });

  it("requires win by 2 after deuce", () => {
    const deuce = rallyTo(createMatch(), 24, 24);
    const twentySix = rallyTo(deuce, 26, 24);
    expect(twentySix.match.homeSets).toBe(1);
    expect(twentySix.match.completedSets[0]).toMatchObject({ homeScore: 26, awayScore: 24, winner: "home" });
  });
});

describe("deciding set", () => {
  it("uses 15 in club set 3", () => {
    let engine = winSet(createMatch(), "home");
    engine = winSet(engine, "away");
    expect(engine.match.setNumber).toBe(3);
    expect(engine.match.homeSets).toBe(1);
    expect(engine.match.awaySets).toBe(1);
    expect(pointsToWin(engine.match)).toBe(15);

    const late = rallyTo(engine, 14, 13);
    expect(isSetPoint(late.match, "home")).toBe(true);
    expect(isMatchPoint(late.match, "home")).toBe(true);

    const won = point(late, "home");
    expect(won.match.homeSets).toBe(2);
    expect(won.match.winner).toBe("home");
    expect(won.match.homeScore).toBe(15);
    expect(won.match.awayScore).toBe(13);
  });

  it("uses 15 in high school set 5", () => {
    let engine = createMatch({ matchFormat: "highschool" });
    expect(engine.match.setsToWin).toBe(3);
    expect(engine.match.matchSets).toBe(5);

    engine = winSet(engine, "home");
    engine = winSet(engine, "away");
    engine = winSet(engine, "home");
    engine = winSet(engine, "away");
    expect(engine.match.setNumber).toBe(5);
    expect(engine.match.homeSets).toBe(2);
    expect(engine.match.awaySets).toBe(2);
    expect(pointsToWin(engine.match)).toBe(15);
  });
});

describe("match end", () => {
  it("ends the match when sets-to-win is reached", () => {
    let engine = winSet(createMatch(), "home");
    engine = winSet(engine, "home");
    expect(engine.match.homeSets).toBe(2);
    expect(engine.match.winner).toBe("home");
    expect(isMatchOver(engine.match)).toBe(true);
  });

  it("rejects further points until newMatch()", () => {
    let engine = winSet(createMatch(), "home");
    engine = winSet(engine, "home");
    const frozen = point(engine, "away");
    expect(frozen).toBe(engine);
    expect(frozen.match.awayScore).toBe(engine.match.awayScore);

    const reset = newMatch(engine);
    expect(reset.match.winner).toBe("");
    expect(reset.match.homeScore).toBe(0);
    expect(reset.match.homeSets).toBe(0);
    expect(reset.match.setNumber).toBe(1);
    expect(reset.match.servingSide).toBe("");
    expect(reset.match.completedSets).toEqual([]);
    expect(canUndo(reset)).toBe(false);

    const firstPoint = point(reset, "home");
    expect(firstPoint.match.homeScore).toBe(1);
  });
});

describe("undo", () => {
  it("restores the previous rally", () => {
    let engine = point(createMatch(), "home");
    engine = point(engine, "away");
    engine = point(engine, "home");
    expect(engine.match.homeScore).toBe(2);
    expect(engine.match.awayScore).toBe(1);

    const undone = undo(engine);
    expect(undone.match.homeScore).toBe(1);
    expect(undone.match.awayScore).toBe(1);
    expect(canUndo(undone)).toBe(true);
  });

  it("undoes a set that just completed", () => {
    const late = rallyTo(createMatch(), 24, 23);
    const won = point(late, "home");
    expect(won.match.setNumber).toBe(2);
    expect(won.match.homeSets).toBe(1);

    const restored = undo(won);
    expect(restored.match.setNumber).toBe(1);
    expect(restored.match.homeSets).toBe(0);
    expect(restored.match.homeScore).toBe(24);
    expect(restored.match.awayScore).toBe(23);
    expect(restored.match.completedSets).toEqual([]);
  });

  it("undoes a match-winning point", () => {
    let engine = winSet(createMatch(), "home");
    const beforeMatchPoint = rallyTo(engine, 24, 23);
    const won = point(beforeMatchPoint, "home");
    expect(won.match.winner).toBe("home");

    const restored = undo(won);
    expect(restored.match.winner).toBe("");
    expect(restored.match.homeSets).toBe(1);
    expect(restored.match.homeScore).toBe(24);
    expect(restored.match.awayScore).toBe(23);
  });

  it("does nothing when the undo stack is empty", () => {
    const engine = createMatch();
    expect(canUndo(engine)).toBe(false);
    expect(undo(engine)).toBe(engine);
  });
});

describe("subtract", () => {
  it("only lowers the current set score", () => {
    const engine = rallyTo(createMatch(), 5, 3);
    const lowered = subtract(engine, "home");
    expect(lowered.match.homeScore).toBe(4);
    expect(lowered.match.awayScore).toBe(3);
  });

  it("does not reverse a completed set", () => {
    const won = winSet(createMatch(), "home");
    expect(won.match.homeSets).toBe(1);
    expect(won.match.homeScore).toBe(0);
    const after = subtract(won, "home");
    expect(after).toBe(won);
  });
});

describe("setup commands", () => {
  it("keeps names and colors across newMatch", () => {
    let engine = setNames(createMatch(), "Blazers", "Eastside");
    engine = setColors(engine, "#111111", "#222222");
    engine = point(engine, "home");
    engine = newMatch(engine);
    expect(engine.match.homeName).toBe("Blazers");
    expect(engine.match.awayName).toBe("Eastside");
    expect(engine.match.homeColor).toBe("#111111");
    expect(engine.match.awayColor).toBe("#222222");
    expect(engine.match.homeScore).toBe(0);
  });

  it("resets progress when the format changes", () => {
    let engine = rallyTo(createMatch(), 10, 8);
    engine = applyFormat(engine, "highschool");
    expect(engine.match.matchFormat).toBe("highschool");
    expect(engine.match.matchSets).toBe(5);
    expect(engine.match.setsToWin).toBe(3);
    expect(engine.match.homeScore).toBe(0);
    expect(engine.match.awayScore).toBe(0);
    expect(canUndo(engine)).toBe(false);
  });
});

describe("matchBanner", () => {
  it("shows first-to-25 until a set or match point", () => {
    expect(matchBanner(createMatch().match)).toBe("FIRST TO 25");
  });

  it("names the team on set point and match point", () => {
    const late = rallyTo(setNames(createMatch(), "Blazers", "Eastside"), 24, 23);
    expect(matchBanner(late.match)).toBe("SET POINT — Blazers");

    const setOne = winSet(createMatch({ homeName: "Blazers", awayName: "Eastside" }), "home");
    const matchPoint = rallyTo(setNames(setOne, "Blazers", "Eastside"), 24, 20);
    expect(matchBanner(matchPoint.match)).toBe("MATCH POINT — Blazers");
  });

  it("names the winner when the match ends", () => {
    let engine = setNames(createMatch(), "Blazers", "Eastside");
    engine = winSet(engine, "home");
    engine = winSet(engine, "home");
    expect(isMatchOver(engine.match)).toBe(true);
    expect(matchBanner(engine.match)).toBe("MATCH WON — Blazers");
  });
});

describe("serving", () => {
  it("starts with nobody serving until a tap or the first point", () => {
    const engine = createMatch();
    expect(engine.match.servingSide).toBe("");
    expect(isServing(engine.match, "home")).toBe(false);
    expect(isServing(engine.match, "away")).toBe(false);
  });

  it("lets the scorer tap who serves first", () => {
    const home = setServe(createMatch(), "home");
    expect(home.match.servingSide).toBe("home");
    expect(isServing(home.match, "home")).toBe(true);
    expect(canUndo(home)).toBe(true);

    const away = setServe(home, "away");
    expect(away.match.servingSide).toBe("away");
    expect(undo(away).match.servingSide).toBe("home");
  });

  it("does not snapshot when the same side is already serving", () => {
    const home = setServe(createMatch(), "home");
    expect(setServe(home, "home")).toBe(home);
  });

  it("keeps serve on a held point and flips on side-out", () => {
    let engine = setServe(createMatch(), "home");
    engine = point(engine, "home");
    expect(engine.match.servingSide).toBe("home");
    engine = point(engine, "away");
    expect(engine.match.servingSide).toBe("away");
    engine = point(engine, "away");
    expect(engine.match.servingSide).toBe("away");
  });

  it("undoes serve with the rally", () => {
    let engine = setServe(createMatch(), "home");
    engine = point(engine, "away");
    expect(engine.match.servingSide).toBe("away");
    const restored = undo(engine);
    expect(restored.match.homeScore).toBe(0);
    expect(restored.match.awayScore).toBe(0);
    expect(restored.match.servingSide).toBe("home");
  });

  it("clears serve at the start of the next set", () => {
    const won = winSet(setServe(createMatch(), "home"), "home");
    expect(won.match.setNumber).toBe(2);
    expect(won.match.servingSide).toBe("");
  });

  it("keeps the winner serving after match point", () => {
    let engine = winSet(createMatch(), "home");
    engine = setServe(engine, "home");
    engine = winSet(engine, "home");
    expect(engine.match.winner).toBe("home");
    expect(engine.match.servingSide).toBe("home");
  });

  it("leaves serve alone on minus-one", () => {
    let engine = setServe(createMatch(), "home");
    engine = point(engine, "away");
    expect(engine.match.servingSide).toBe("away");
    const lowered = subtract(engine, "away");
    expect(lowered.match.awayScore).toBe(0);
    expect(lowered.match.servingSide).toBe("away");
  });
});
