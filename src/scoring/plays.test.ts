import { describe, expect, it } from "vitest";
import { createMatch, reduce } from "./reducer";
import { matchPlays, playText } from "./plays";
import { parseMatchEngine } from "../storage/matchEngine";
const call = { id: "one", kind: "kill" as const, side: "home" as const, atMs: 100, player: { id: "p", name: "Sophia", number: "12" } };
describe("player scoring highlights", () => {
  it.each(["ace", "kill", "block"] as const)("%s adds exactly one point; Undo removes the play and score", (kind) => {
    const initial = createMatch();
    const engine = reduce(initial, { type: "highlight", call: { ...call, kind } });
    expect(engine.match.homeScore).toBe(1);
    expect(matchPlays(engine)).toHaveLength(1);
    expect(reduce(engine, { type: "undo" })).toEqual(initial);
    expect(matchPlays(reduce(engine, { type: "undo" }))).toEqual([]);
  });
  it("survives reload and intervening rallies without repeating a call", () => {
    let engine = reduce(createMatch(), { type: "highlight", call });
    engine = reduce(engine, { type: "timeout", side: "home", nowMs: 101 });
    engine = reduce(engine, { type: "endTimeout", nowMs: 102 });
    engine = reduce(engine, { type: "point", side: "away" });
    const loaded = parseMatchEngine(JSON.parse(JSON.stringify(engine)))!;
    expect(matchPlays(loaded)).toHaveLength(1);
    expect(playText(matchPlays(loaded)[0])).toBe("#12 Sophia — Kill!");
    expect(matchPlays(loaded)[0].score).toEqual({ set: 1, home: 1, away: 0 });
    expect(matchPlays(reduce(loaded, { type: "newMatch" }))).toEqual([]);
  });
  it("records the set-winning score before the board resets and respects the set gate", () => {
    const engine = reduce(createMatch({ homeScore: 24, awayScore: 20 }), { type: "highlight", call });
    expect(engine.match.pendingSet).toBe(true);
    expect(matchPlays(engine)[0].score).toEqual({ set: 1, home: 25, away: 20 });
    expect(reduce(engine, { type: "highlight", call: { ...call, id: "blocked" } })).toBe(engine);
    expect(matchPlays(reduce(engine, { type: "continueSet" }))).toHaveLength(1);
    expect(matchPlays(reduce(reduce(engine, { type: "continueSet" }), { type: "undo" }))).toEqual([]);
  });
  it.each(["ace", "kill", "block"] as const)("keeps team-level %s calls for both sides without requiring a roster", (kind) => {
    for (const side of ["home", "away"] as const) {
      const initial = createMatch({ homeName: "Panthers", awayName: "Rivals" });
      const scored = reduce(initial, { type: "highlight", call: { id: kind, kind, side, atMs: 100 } });
      const plays = matchPlays(scored);
      expect(plays).toHaveLength(1);
      expect(plays[0].player).toBeUndefined();
      expect(playText(plays[0])).toBe(`${side === "home" ? "Panthers" : "Rivals"} — ${kind[0].toUpperCase()}${kind.slice(1)}!`);
      expect(plays[0].score).toEqual({ set: 1, home: side === "home" ? 1 : 0, away: side === "away" ? 1 : 0 });
      const later = reduce(scored, { type: "point", side: "away" });
      expect(later.match.lastHighlight).toBeNull();
      expect(matchPlays(parseMatchEngine(JSON.parse(JSON.stringify(later))))).toEqual(plays);
      expect(matchPlays(reduce(scored, { type: "undo" }))).toEqual([]);
    }
  });
  it("retains a general set-winning call through Continue, and Undo removes it", () => {
    const won = reduce(createMatch({ homeScore: 24, awayScore: 20 }), { type: "highlight", call: { id: "win", side: "home", kind: "ace", atMs: 1 } });
    const continued = reduce(won, { type: "continueSet" });
    expect(matchPlays(continued)[0].score).toEqual({ set: 1, home: 25, away: 20 });
    expect(matchPlays(reduce(continued, { type: "undo" }))).toEqual([]);
  });
  it("keeps opponent player calls out of the feed", () => {
    const engine = reduce(createMatch(), { type: "highlight", call: { ...call, side: "away" } });
    expect(matchPlays(engine)).toEqual([]);
  });
});
