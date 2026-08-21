import { describe, expect, it } from "vitest";
import { createMatch, point } from "../scoring";
import { detectBoardFx, boardFxKey, setHistoryTickerCopy, setHistoryTickerItems, setWinnerColor, stackTeamNameLines } from "./boardChrome";

describe("stackTeamNameLines", () => {
  it("keeps a short one-word name on a single line", () => {
    expect(stackTeamNameLines("Blazers")).toEqual(["Blazers"]);
  });

  it("stacks a long two-word name instead of shrinking it", () => {
    expect(stackTeamNameLines("Savage Gardenville")).toEqual(["Savage", "Gardenville"]);
  });

  it("splits longer names near the middle word", () => {
    expect(stackTeamNameLines("Sandhills Blazers Volleyball")).toEqual(["Sandhills Blazers", "Volleyball"]);
  });
});

describe("setHistoryTickerItems", () => {
  it("scrolls completed set winners with team color and scores", () => {
    let engine = createMatch({
      homeName: "McBee Panthers",
      awayName: "Knights",
      homeColor: "#d62828",
      awayColor: "#16a34a"
    });
    for (let i = 0; i < 18; i += 1) engine = point(engine, "away");
    for (let i = 0; i < 24; i += 1) engine = point(engine, "home");
    engine = point(engine, "home");
    const items = setHistoryTickerItems(engine.match);
    expect(items).toEqual([
      {
        key: "1-home-25-18",
        setNumber: 1,
        winnerName: "McBee Panthers",
        winnerColor: "#d62828",
        winnerScore: 25,
        loserScore: 18,
        label: "WINNER SET 1:",
        detail: "McBee Panthers - 25:18"
      }
    ]);
    expect(setHistoryTickerCopy(items)).toBe("WINNER SET 1: McBee Panthers - 25:18");
    expect(setWinnerColor(engine.match, engine.match.completedSets[0])).toBe("#d62828");
  });
});

describe("boardFxKey", () => {
  it("changes when a point is scored so the toast can fire", () => {
    const start = createMatch().match;
    const scored = point(createMatch(), "away").match;
    expect(boardFxKey(start)).not.toBe(boardFxKey(scored));
    expect(boardFxKey(null)).toBe("");
  });
});

describe("detectBoardFx", () => {
  it("flashes the scoring side on a normal point", () => {
    const start = createMatch().match;
    const scored = point(createMatch(), "away").match;
    expect(detectBoardFx(start, scored)).toEqual({ pointSide: "away", setWinnerSide: null });
  });

  it("flashes the winner badge on the point that closes a set", () => {
    let engine = createMatch({ homeName: "Blazers" });
    for (let i = 0; i < 24; i += 1) engine = point(engine, "home");
    const before = engine.match;
    engine = point(engine, "home");
    expect(detectBoardFx(before, engine.match)).toEqual({ pointSide: "home", setWinnerSide: "home" });
    expect(engine.match.completedSets).toHaveLength(1);
  });
});
