import { describe, expect, it } from "vitest";
import { createMatch } from "../scoring";
import { endedMatchup, prematchMeta } from "./PrematchOverlay";

describe("prematchMeta", () => {
  it("uses set number and race-to points while the match is live", () => {
    expect(prematchMeta(createMatch().match, false)).toBe("Set 1 · Race to 25");
  });

  it("explains a finished live match", () => {
    expect(prematchMeta(createMatch().match, true)).toBe("This live match has ended.");
  });

  it("waits for the live payload", () => {
    expect(prematchMeta(null, false)).toBe("Connecting…");
  });
});

describe("endedMatchup", () => {
  it("stacks long names, marks the winner, and includes set wins", () => {
    const matchup = endedMatchup(
      {
        ...createMatch({ homeName: "Blazers", awayName: "Savage Gardenville" }).match,
        winner: "home",
        homeSets: 2,
        awaySets: 0
      },
      { homeLogo: "https://example.com/home.png", awayLogo: "https://example.com/away.png" }
    );

    expect(matchup.home).toMatchObject({
      name: "Blazers",
      lines: ["BLAZERS"],
      logo: "https://example.com/home.png",
      winner: true
    });
    expect(matchup.away).toMatchObject({
      name: "Savage Gardenville",
      lines: ["SAVAGE", "GARDENVILLE"],
      logo: "https://example.com/away.png",
      winner: false
    });
    expect(matchup.homeSets).toBe(2);
    expect(matchup.awaySets).toBe(0);
  });

  it("does not mark a winner when the live match was ended early", () => {
    const matchup = endedMatchup(createMatch({ homeName: "Blazers", awayName: "Eastside" }).match);
    expect(matchup.home.winner).toBe(false);
    expect(matchup.away.winner).toBe(false);
    expect(matchup.homeSets).toBe(0);
    expect(matchup.awaySets).toBe(0);
  });

  it("stacks welcome-screen names the same way without requiring a winner", () => {
    const matchup = endedMatchup(
      createMatch({ homeName: "McBee Panthers", awayName: "Chesterfield Rams" }).match
    );
    expect(matchup.home.lines).toEqual(["MCBEE", "PANTHERS"]);
    expect(matchup.away.lines).toEqual(["CHESTERFIELD", "RAMS"]);
    expect(matchup.home.winner).toBe(false);
    expect(matchup.away.winner).toBe(false);
  });
});
