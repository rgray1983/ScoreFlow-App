import { describe, expect, it } from "vitest";
import { callTimeout, createMatch, newMatch, point, reduce, setServe, subtract, undo } from "./index";
import { boardEnergyAttributes, pressureState, runHeat } from "../ui/boardEnergy";
import { parseMatchState } from "../storage/matchEngine";
import { scoreFields } from "../live/payload";
import { parseLiveGame } from "../live/games";

describe("run weather", () => {
  it("warms at 3, shows a run at 5, burns at 7, and cools on side-out", () => {
    let engine = createMatch();
    for (let i = 1; i <= 7; i++) {
      engine = point(engine, "home");
      expect(engine.match.runLength).toBe(i);
      expect(runHeat(engine.match, "home")).toBe(i >= 7 ? 3 : i >= 5 ? 2 : i >= 3 ? 1 : 0);
      expect(runHeat(engine.match, "away")).toBe(0);
    }
    const broken = point(engine, "away");
    expect(broken.match.runSide).toBe("away");
    expect(broken.match.runLength).toBe(1);
    expect(runHeat(broken.match, "home")).toBe(0);
    expect(undo(broken).match.runLength).toBe(7);
    expect(runHeat(undo(engine).match, "home")).toBe(2);
  });

  it("does not count serve taps or timeouts as rallies; subtraction clears uncertain momentum", () => {
    let engine = createMatch();
    for (let i = 0; i < 5; i++) engine = point(engine, "home");
    engine = setServe(engine, "away");
    engine = callTimeout(engine, "away", 1000);
    expect(engine.match.runLength).toBe(5);
    expect(subtract(engine, "home").match.runLength).toBe(0);
    expect(newMatch(engine).match.runLength).toBe(0);
  });
});

describe("set gate", () => {
  it("holds a finished set until continue, rejects scoring, and keeps Undo on the winning rally", () => {
    const before = createMatch({ homeScore: 24, awayScore: 22, homeTimeouts: 0 });
    const won = point(before, "home");
    expect(won.match.pendingSet).toBe(true);
    expect(won.match.completedSets[0]).toMatchObject({ homeScore: 25, awayScore: 22 });
    expect(won.match.runLength).toBe(0);
    expect(won.match.homeTimeouts).toBe(2);
    expect(point(won, "away")).toBe(won);
    expect(setServe(won, "home")).toBe(won);
    expect(callTimeout(won, "home")).toBe(won);
    const continued = reduce(won, { type: "continueSet" });
    expect(continued.match.pendingSet).toBe(false);
    expect(point(continued, "away").match.awayScore).toBe(1);
    expect(undo(continued)).toEqual(before);
  });

  it("never opens after match point in club or high school formats", () => {
    for (const matchFormat of ["club", "highschool"] as const) {
      const sets = matchFormat === "club" ? 1 : 2;
      const won = point(createMatch({ matchFormat, homeSets: sets, homeScore: 24, awayScore: 20 }), "home");
      expect(won.match.winner).toBe("home");
      expect(won.match.pendingSet).toBe(false);
    }
  });
});

describe("highlights", () => {
  for (const kind of ["ace", "kill", "block"] as const) {
    it(`${kind} awards one rally and undoes its score, serve and effect together`, () => {
      const before = createMatch({ servingSide: "away" });
      const call = { id: kind, kind, side: "home" as const, atMs: 1000 };
      const engine = reduce(before, { type: "highlight", call });
      expect(engine.match.homeScore).toBe(1);
      expect(engine.match.servingSide).toBe("home");
      expect(engine.match.lastHighlight).toEqual(call);
      expect(undo(engine)).toEqual(before);
      expect(point(engine, "away").match.lastHighlight).toBeNull();
    });
  }

  it("keeps the highlight on a set-winning point without adding a second point", () => {
    const engine = reduce(createMatch({ homeScore: 24, awayScore: 22 }), {
      type: "highlight", call: { id: "set-ace", kind: "ace", side: "home", atMs: 1000 }
    });
    expect(engine.match.completedSets[0].homeScore).toBe(25);
    expect(engine.match.lastHighlight?.kind).toBe("ace");
    expect(engine.match.pendingSet).toBe(true);
  });
});

describe("board pressure", () => {
  it("activates for set/match point, clears at deuce or Undo, and respects a 15-point decider", () => {
    const engine = point(createMatch({ homeScore: 23, awayScore: 22 }), "home");
    expect(pressureState(engine.match)).toEqual({ side: "home", kind: "set" });
    expect(pressureState(undo(engine).match)).toBeNull();
    expect(pressureState(createMatch({ homeScore: 24, awayScore: 24 }).match)).toBeNull();
    expect(pressureState(createMatch({ homeScore: 25, awayScore: 24, homeSets: 1 }).match)).toEqual({ side: "home", kind: "match" });
    expect(pressureState(createMatch({ setNumber: 3, homeSets: 1, awaySets: 1, awayScore: 14, homeScore: 12 }).match)).toEqual({ side: "away", kind: "match" });
  });
});

describe("saved and live add-ons", () => {
  it("round-trips a held decider and a highlight to a viewer and reload", () => {
    const last = { set: 2, homeScore: 23, awayScore: 25, winner: "away" as const };
    const match = createMatch({ boardTheme: "flip-clock", setNumber: 3, pendingSet: true, completedSets: [last],
      lastHighlight: { id: "decider", kind: "block", side: "away", atMs: 1000 } }).match;
    const live = parseLiveGame(scoreFields(match))!;
    expect(live.match).toEqual(match);
    expect(parseMatchState(match)).toEqual(match);
    expect(boardEnergyAttributes(live.match)).toEqual(boardEnergyAttributes(match));
  });

  it("defaults old and malformed data without inferring a run or holding a live set", () => {
    const old = parseMatchState({ homeScore: 12, awayScore: 9 })!;
    expect(old.boardTheme).toBe("classic");
    expect(old.runLength).toBe(0);
    expect(old.pendingSet).toBe(false);
    expect(old.lastHighlight).toBeNull();
    const invalid = parseMatchState({ boardTheme: "bad", runLength: -4, pendingSet: "true", lastHighlight: { kind: "bad" } })!;
    expect(invalid.boardTheme).toBe("classic");
    expect(invalid.pendingSet).toBe(false);
    expect(invalid.lastHighlight).toBeNull();
  });

  it("keeps the selected style through Undo and New Match", () => {
    const engine = reduce(point(createMatch(), "home"), { type: "setBoardTheme", theme: "old-school" });
    expect(undo(engine).match.boardTheme).toBe("old-school");
    expect(newMatch(engine).match.boardTheme).toBe("old-school");
  });
});
