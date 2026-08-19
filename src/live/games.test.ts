import { describe, expect, it } from "vitest";
import { parseLiveGame } from "./games";

describe("parseLiveGame", () => {
  it("reads a live document without logo bytes", () => {
    const game = parseLiveGame({
      homeScore: 12,
      awayScore: 9,
      homeSets: 1,
      awaySets: 0,
      setNumber: 2,
      matchFormat: "club",
      matchTitle: "Region",
      homeName: "Blazers",
      awayName: "Eastside",
      homeColor: "#d62828",
      awayColor: "#1565c0",
      winner: "",
      completedSets: [{ set: 1, homeScore: 25, awayScore: 18, winner: "home" }],
      homeLogo: "https://example.com/home.png",
      awayLogo: "data:image/png;base64,xx",
      ended: false,
      ownerId: "uid-1"
    });
    expect(game?.match.homeScore).toBe(12);
    expect(game?.match.homeName).toBe("Blazers");
    expect(game?.homeLogo).toBe("https://example.com/home.png");
    expect(game?.awayLogo).toBe("");
    expect(game?.ended).toBe(false);
  });
});
