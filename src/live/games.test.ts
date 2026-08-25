import { describe, expect, it } from "vitest";
import { createMatch, point } from "../scoring";
import { parseLiveGame } from "./games";
import { scoreFields } from "./payload";

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
    expect(game?.awayLogo).toBe("data:image/png;base64,xx");
    expect(game?.scorerName).toBe("");
    expect(game?.scorerAvatar).toBe("");
    expect(game?.ended).toBe(false);
    expect(game?.chatPaused).toBe(false);
    expect(game?.ownerId).toBe("uid-1");
  });

  it("reads chatPaused from the live document", () => {
    const game = parseLiveGame({
      homeScore: 0,
      awayScore: 0,
      homeSets: 0,
      awaySets: 0,
      setNumber: 1,
      matchFormat: "club",
      matchTitle: "Region",
      homeName: "Home",
      awayName: "Away",
      homeColor: "#d62828",
      awayColor: "#1565c0",
      winner: "",
      completedSets: [],
      ownerId: "uid-1",
      chatPaused: true
    });
    expect(game?.chatPaused).toBe(true);
  });

  it("reads the scorer name and photo from the live document", () => {
    const game = parseLiveGame({
      homeScore: 0,
      awayScore: 0,
      homeSets: 0,
      awaySets: 0,
      setNumber: 1,
      matchFormat: "club",
      matchTitle: "Region",
      homeName: "Home",
      awayName: "Away",
      homeColor: "#d62828",
      awayColor: "#1565c0",
      winner: "",
      completedSets: [],
      ownerId: "uid-1",
      scorerName: "Coach Richie",
      scorerAvatar: "https://example.com/scorer.png"
    });
    expect(game?.scorerName).toBe("Coach Richie");
    expect(game?.scorerAvatar).toBe("https://example.com/scorer.png");
  });

  it("shows a scorer point on the parsed viewer payload", () => {
    const scored = point(createMatch({ homeName: "Blazers" }), "home");
    const view = parseLiveGame({ ...scoreFields(scored.match), ownerId: "uid-1" });
    expect(view?.match.homeScore).toBe(1);
    expect(view?.match.awayScore).toBe(0);
    expect(view?.match.homeName).toBe("Blazers");
    expect(view?.match.servingSide).toBe("home");
    expect(view?.match.homeTimeouts).toBe(2);
    expect(view?.match.activeTimeout).toBe("");
  });
});
