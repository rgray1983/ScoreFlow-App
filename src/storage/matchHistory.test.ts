import { describe, expect, it } from "vitest";
import { createMatch, isMatchOver, point, reduce, type MatchEngine, type Side } from "../scoring";
import { memoryStorage } from "./local";
import {
  FREE_MATCH_HISTORY_LIMIT,
  MATCH_HISTORY_KEY,
  formatMatchDate,
  historyMatchFromLive,
  loadMatches,
  matchSetCount,
  parseHistoryMatch,
  recordCompletedMatch,
  resetHistorySaveGuard,
  winnerSaveKey
} from "./matchHistory";

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
  let next = rallyTo(
    engine,
    side === "home" ? Math.max(25, engine.match.homeScore) : engine.match.homeScore,
    side === "away" ? Math.max(25, engine.match.awayScore) : engine.match.awayScore
  );
  while (next.match.setNumber === beforeSet && !isMatchOver(next.match)) {
    next = point(next, side);
  }
  return next;
}

describe("match history", () => {
  it("parses the current-app history shape", () => {
    const match = parseHistoryMatch({
      id: "match-abc",
      title: "Friday Night",
      homeName: "Blazers",
      awayName: "Eastside",
      homeSets: 2,
      awaySets: 1,
      winner: "Blazers",
      winnerSide: "home",
      homeLogo: "data:image/png;base64,xx",
      awayLogo: "",
      completedSets: [
        { set: 1, homeScore: 25, awayScore: 20, winner: "home" },
        { set: 2, homeScore: 19, awayScore: 25, winner: "away" },
        { set: 3, homeScore: 15, awayScore: 10, winner: "home" }
      ],
      matchFormat: "club",
      matchSets: 3,
      resultBackground: "default",
      updatedAtMs: 1700000000000
    });
    expect(match).toMatchObject({
      id: "match-abc",
      title: "Friday Night",
      homeName: "Blazers",
      winnerSide: "home",
      matchSets: 3
    });
    expect(match?.completedSets).toHaveLength(3);
  });

  it("treats names as plain text and fills defaults", () => {
    const match = parseHistoryMatch({
      homeName: "<b>Hack</b>",
      awaySets: 2,
      homeSets: 0
    });
    expect(match?.homeName).toBe("<b>Hack</b>");
    expect(match?.awayName).toBe("Team 2");
    expect(match?.winnerSide).toBe("away");
  });

  it("counts club matches as 3 sets and high school as 5", () => {
    expect(matchSetCount({ matchSets: 0, matchFormat: "club" })).toBe(3);
    expect(matchSetCount({ matchSets: 0, matchFormat: "highschool" })).toBe(5);
    expect(matchSetCount({ matchSets: 5, matchFormat: "club" })).toBe(5);
  });

  it("formats a match date", () => {
    expect(formatMatchDate(Date.UTC(2026, 7, 20))).toMatch(/2026/);
  });

  it("saves a completed match locally and skips the same winner twice", () => {
    const storage = memoryStorage();
    resetHistorySaveGuard();
    let engine = createMatch({ homeName: "Blazers", awayName: "Eastside" });
    engine = winSet(engine, "home");
    engine = winSet(engine, "home");
    expect(engine.match.winner).toBe("home");

    const first = recordCompletedMatch({ match: engine.match, homeLogo: "logo-a" }, storage);
    const second = recordCompletedMatch({ match: engine.match, homeLogo: "logo-a" }, storage);
    expect(first?.id).toBe(second?.id);
    expect(loadMatches(storage)).toHaveLength(1);
    expect(winnerSaveKey(engine.match)).toContain("home-");
  });

  it("keeps only the latest free-plan matches", () => {
    const storage = memoryStorage();
    resetHistorySaveGuard();
    for (let i = 0; i < 5; i++) {
      resetHistorySaveGuard();
      let engine = createMatch({ homeName: `Home ${i}`, awayName: "Visitor" });
      engine = winSet(engine, "home");
      engine = winSet(engine, "home");
      recordCompletedMatch({ match: engine.match, now: 1000 + i }, storage);
    }
    const matches = loadMatches(storage);
    expect(matches).toHaveLength(FREE_MATCH_HISTORY_LIMIT);
    expect(matches[0]?.homeName).toBe("Home 4");
    expect(JSON.parse(storage.getItem(MATCH_HISTORY_KEY) || "[]")).toHaveLength(3);
  });

  it("builds a history record from live match state", () => {
    const engine = reduce(createMatch({ homeName: "Blazers", matchTitle: "Rumble" }), { type: "point", side: "home" });
    const record = historyMatchFromLive({
      match: { ...engine.match, winner: "home", homeSets: 2, awaySets: 0 },
      homeLogo: "x"
    });
    expect(record?.title).toBe("Rumble");
    expect(record?.winner).toBe("Blazers");
    expect(record?.homeLogo).toBe("x");
  });
});
