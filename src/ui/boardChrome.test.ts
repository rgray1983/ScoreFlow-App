import { describe, expect, it } from "vitest";
import { createMatch, point } from "../scoring";
import { detectBoardFx, fitFontSize, setHistoryTickerCopy, setHistoryTickerItems, setWinnerColor, shouldRefitName } from "./boardChrome";

describe("fitFontSize", () => {
  it("keeps the starting size when the name already fits", () => {
    expect(fitFontSize(120, 180, 32, 10)).toBe(32);
  });

  it("shrinks until a long name would fit the slot", () => {
    expect(fitFontSize(240, 120, 32, 10)).toBe(16);
    expect(fitFontSize(800, 100, 32, 12)).toBe(12);
  });
});

describe("shouldRefitName", () => {
  it("ignores height-only jitter so the name does not keep resizing", () => {
    expect(shouldRefitName(-1, 180)).toBe(true);
    expect(shouldRefitName(180, 180)).toBe(false);
    expect(shouldRefitName(180, 181)).toBe(false);
    expect(shouldRefitName(180, 184)).toBe(true);
    expect(shouldRefitName(180, 0)).toBe(false);
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
