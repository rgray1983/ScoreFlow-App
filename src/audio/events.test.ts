import { describe, expect, it } from "vitest";
import { createMatch, reduce, type Command, type MatchEngine } from "../scoring";
import { parseMatchEngine } from "../storage/matchEngine";
import { scoreFields } from "../live/payload";
import { parseLiveGame } from "../live/games";
import { SoundCursor, parseSoundEvent, withSoundEvent } from "./events";

function apply(engine: MatchEngine, command: Command, id = "new") {
  return withSoundEvent(engine, reduce(engine, command), command, () => ({ id, atMs: 1000 }));
}
describe("score sound metadata", () => {
  it("plays point or the general call, then only the exact 4/7 run milestone", () => {
    let engine = createMatch();
    for (let n = 1; n <= 8; n++) {
      engine = apply(engine, { type: "point", side: "home" }, String(n));
      expect(engine.match.lastSound?.cues).toEqual(n === 4 ? ["point", "heating-up"] : n === 7 ? ["point", "on-fire"] : ["point"]);
    }
    for (const kind of ["ace", "kill", "block"] as const) {
      const next = apply(engine, { type: "highlight", call: { id: kind, kind, atMs: 1000, side: "away" } });
      expect(next.match.lastSound?.cues).toEqual([kind]);
      expect(next.match.awayScore).toBe(1);
    }
    const player = { id: "p", name: "Sophia", number: "12" };
    expect(apply(engine, { type: "highlight", call: { id: "p", kind: "kill", atMs: 1000, side: "home", player } }).match.lastSound?.cues).toEqual(["point"]);
  });
  it("keeps milestone sound on a set-winning point and starts a fresh run after the gate", () => {
    let engine = createMatch({ homeScore: 24, awayScore: 20, runSide: "home", runLength: 3 });
    engine = apply(engine, { type: "highlight", call: { id: "win", kind: "ace", side: "home", atMs: 1000 } });
    expect(engine.match.pendingSet).toBe(true);
    expect(engine.match.lastSound?.cues).toEqual(["ace", "heating-up"]);
    engine = apply(engine, { type: "continueSet" });
    expect(apply(engine, { type: "point", side: "home" }).match.lastSound?.cues).toEqual(["point"]);
  });
  it("does not create events for rejected actions, Undo, corrections, resets or timeout end", () => {
    let engine = apply(createMatch(), { type: "point", side: "home" });
    expect(apply(engine, { type: "undo" }).match.lastSound).toBeNull();
    expect(apply(engine, { type: "subtract", side: "home" }).match.lastSound).toBeNull();
    expect(apply(engine, { type: "newMatch" }).match.lastSound).toBeNull();
    engine = apply(engine, { type: "timeout", side: "home", nowMs: 1000 });
    expect(engine.match.lastSound?.cues).toEqual(["timeout"]);
    expect(apply(engine, { type: "timeout", side: "away" })).toBe(engine);
    expect(apply(engine, { type: "endTimeout", nowMs: 62000 }).match.lastSound?.id).toBe(engine.match.lastSound?.id);
    const ended = createMatch({ winner: "home" });
    expect(apply(ended, { type: "point", side: "away" })).toBe(ended);
  });
  it("preserves IDs and cue order through local reload and live payload parsing", () => {
    const engine = apply(createMatch({ runSide: "away", runLength: 6 }), { type: "point", side: "away" }, "unique");
    expect(parseMatchEngine(JSON.parse(JSON.stringify(engine)))?.match.lastSound).toEqual(engine.match.lastSound);
    expect(parseLiveGame(scoreFields(engine.match))?.match.lastSound).toEqual(engine.match.lastSound);
    expect(parseMatchEngine({ match: {} })?.match.lastSound).toBeNull();
    for (const value of [{ id: "x", atMs: 1, cues: ["bad"] }, { id: "x", atMs: NaN, cues: ["point"] }, { id: "x", atMs: 1, cues: [] }]) expect(parseSoundEvent(value)).toBeNull();
  });
});

describe("sound delivery cursor", () => {
  const event = (id: string, atMs = 1000) => ({ id, atMs, cues: ["point" as const] });
  it("silences initial history and deduplicates updates, styles and Undo restored IDs", () => {
    const cursor = new SoundCursor();
    expect(cursor.take("a", event("old"), true, 1000)).toEqual([]);
    expect(cursor.take("a", event("new"), true, 1001)).toEqual(["point"]);
    expect(cursor.take("a", event("new"), true, 1002)).toEqual([]);
    cursor.take("a", null, true, 1003);
    expect(cursor.take("a", event("old"), true, 1004)).toEqual([]);
  });
  it("rejects catch-up arriving after an earlier server metadata snapshot restored live status", () => {
    const cursor = new SoundCursor();
    cursor.take("game", event("initial"), true, 1000);
    cursor.silenceThrough(2000);
    cursor.take("game", event("initial"), true, 2001);
    expect(cursor.take("game", event("catchup", 1800), true, 2002)).toEqual([]);
    expect(cursor.take("game", event("next", 2100), true, 2101)).toEqual(["point"]);
  });
  it("never catches up after reconnect, unmute, foreground, game replacement or expired events", () => {
    const cursor = new SoundCursor();
    cursor.take("a", null, true, 1000);
    cursor.take("a", event("offline"), false, 1001);
    expect(cursor.take("a", event("catchup"), true, 1002)).toEqual([]);
    expect(cursor.take("a", event("fresh"), true, 1003)).toEqual(["point"]);
    expect(cursor.take("b", event("replacement"), true, 1004)).toEqual([]);
    expect(cursor.take("b", event("expired", 1), true, 9000)).toEqual([]);
    expect(cursor.take("b", event("future", 10000), true, 9000)).toEqual([]);
    expect(cursor.take("b", { ...event("local", 9000), remote: false }, true, 9000, true)).toEqual([]);
    expect(cursor.take("b", event("next-live", 9001), true, 9001, true)).toEqual(["point"]);
  });
});
