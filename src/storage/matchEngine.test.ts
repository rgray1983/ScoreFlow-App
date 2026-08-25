import { describe, expect, it } from "vitest";
import { createMatch, point } from "../scoring";
import { EMPTY_MATCH_DRAFT } from "./matchSetup";
import {
  engineFromDraft,
  loadMatchEngine,
  matchHasProgress,
  parseMatchEngine,
  saveMatchEngine
} from "./matchEngine";
import { memoryStorage } from "./local";

describe("engineFromDraft", () => {
  it("copies setup into a fresh match", () => {
    const engine = engineFromDraft({
      ...EMPTY_MATCH_DRAFT,
      title: "Region Final",
      format: "highschool",
      homeName: "Blazers",
      awayName: "Eastside",
      homeColor: "#111827",
      awayColor: "#1565c0"
    });
    expect(engine.match.matchTitle).toBe("Region Final");
    expect(engine.match.matchFormat).toBe("highschool");
    expect(engine.match.setsToWin).toBe(3);
    expect(engine.match.homeName).toBe("Blazers");
    expect(engine.match.awayName).toBe("Eastside");
    expect(engine.history).toEqual([]);
    expect(matchHasProgress(engine)).toBe(false);
  });
});

describe("match engine storage", () => {
  it("saves and loads scores plus undo history", () => {
    const storage = memoryStorage();
    const scored = point(createMatch({ homeName: "Blazers" }), "home");
    saveMatchEngine(scored, storage);
    const loaded = loadMatchEngine(storage);
    expect(loaded?.match.homeScore).toBe(1);
    expect(loaded?.match.homeName).toBe("Blazers");
    expect(loaded?.history).toHaveLength(1);
    expect(loaded?.history[0].homeScore).toBe(0);
    expect(matchHasProgress(loaded!)).toBe(true);
  });

  it("saves who is serving", () => {
    const storage = memoryStorage();
    const serving = point(createMatch({ servingSide: "away" }), "home");
    saveMatchEngine(serving, storage);
    const loaded = loadMatchEngine(storage);
    expect(loaded?.match.servingSide).toBe("home");
    expect(loaded?.history[0].servingSide).toBe("away");
  });

  it("saves timeout lights and the running clock", () => {
    const storage = memoryStorage();
    const timed = createMatch({
      homeTimeouts: 1,
      awayTimeouts: 2,
      activeTimeout: "home",
      timeoutEndsAtMs: 1_700_000_045_000
    });
    saveMatchEngine(timed, storage);
    const loaded = loadMatchEngine(storage);
    expect(loaded?.match.homeTimeouts).toBe(1);
    expect(loaded?.match.activeTimeout).toBe("home");
    expect(loaded?.match.timeoutEndsAtMs).toBe(1_700_000_045_000);
  });

  it("defaults missing timeout fields to a full set of lights", () => {
    const parsed = parseMatchEngine({
      match: {
        homeScore: 3,
        awayScore: 1,
        homeSets: 0,
        awaySets: 0,
        setNumber: 1,
        matchFormat: "club",
        matchTitle: "Region",
        homeName: "Blazers",
        awayName: "Eastside",
        homeColor: "#d62828",
        awayColor: "#1565c0",
        winner: "",
        servingSide: "home",
        completedSets: []
      },
      history: []
    });
    expect(parsed?.match.homeTimeouts).toBe(2);
    expect(parsed?.match.awayTimeouts).toBe(2);
    expect(parsed?.match.activeTimeout).toBe("");
    expect(parsed?.match.timeoutEndsAtMs).toBe(0);
  });

  it("rejects junk", () => {
    expect(parseMatchEngine(null)).toBeNull();
    expect(parseMatchEngine({ match: 4 })).toBeNull();
  });
});
