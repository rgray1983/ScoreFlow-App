import { describe, expect, it } from "vitest";
import { loadHomeTeam, saveHomeTeamRecord } from "./homeTeam";
import { memoryStorage } from "./local";

describe("home team storage", () => {
  it("saves and loads a team", () => {
    const storage = memoryStorage();
    saveHomeTeamRecord({
      name: " Blazers ",
      location: "Sandhills, SC",
      color: "#d62828",
      logo: "data:image/png;base64,xx",
      updatedAtMs: 1
    }, storage);
    const loaded = loadHomeTeam(storage);
    expect(loaded?.name).toBe("Blazers");
    expect(loaded?.location).toBe("Sandhills, SC");
    expect(loaded?.logo).toContain("data:image");
  });

  it("rejects a blank name", () => {
    const storage = memoryStorage({ scoreflowHomeTeamV2: JSON.stringify({ name: "  " }) });
    expect(loadHomeTeam(storage)).toBeNull();
  });

  it("normalizes color on save", () => {
    const storage = memoryStorage();
    const saved = saveHomeTeamRecord({
      name: "Blazers",
      location: "",
      color: "#F00",
      logo: "",
      updatedAtMs: 1
    }, storage);
    expect(saved.color).toBe("#ff0000");
  });

  it("refuses to persist a blank name", () => {
    expect(() => saveHomeTeamRecord({
      name: "  ",
      location: "",
      color: "#d62828",
      logo: "",
      updatedAtMs: 1
    })).toThrow("Enter your team name.");
  });
});
