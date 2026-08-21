import { describe, expect, it } from "vitest";
import { resultsBackgroundSrc } from "../storage/premium";
import { canvasInitials, DEFAULT_RESULTS_BACKGROUND, resultsTeamNameLines } from "./results";

describe("results graphic helpers", () => {
  it("builds one or two initials from a team name", () => {
    expect(canvasInitials("Blazers")).toBe("B");
    expect(canvasInitials("Sandhills Blazers")).toBe("SB");
    expect(canvasInitials("  ")).toBe("T");
  });

  it("uses the selected results background file", () => {
    expect(resultsBackgroundSrc("default")).toBe(DEFAULT_RESULTS_BACKGROUND);
    expect(resultsBackgroundSrc("power-hitter")).toBe("/images/results/power-hitter.png");
  });
});

describe("resultsTeamNameLines", () => {
  it("keeps a short name on one line", () => {
    expect(resultsTeamNameLines("Blazers")).toEqual(["BLAZERS"]);
  });

  it("stacks a long two-word name instead of truncating it", () => {
    expect(resultsTeamNameLines("Savage Gardenville")).toEqual(["SAVAGE", "GARDENVILLE"]);
  });
});
