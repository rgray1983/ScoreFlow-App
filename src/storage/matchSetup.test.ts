import { describe, expect, it } from "vitest";
import { DEFAULT_AWAY_COLOR, DEFAULT_HOME_COLOR } from "../lib/color";
import type { HomeTeam } from "./homeTeam";
import {
  commitMatchDraft,
  EMPTY_MATCH_DRAFT,
  loadMatchDraft,
  mergeHomeTeamIntoDraft,
  parseMatchDraft,
  saveMatchDraft
} from "./matchSetup";
import { memoryStorage } from "./local";

const blazers: HomeTeam = {
  name: "Blazers",
  location: "Sandhills, SC",
  color: "#d62828",
  logo: "data:image/png;base64,xx",
  updatedAtMs: 1
};

describe("match draft storage", () => {
  it("fills defaults for a missing draft", () => {
    expect(parseMatchDraft(null)).toEqual(EMPTY_MATCH_DRAFT);
    expect(loadMatchDraft(memoryStorage()).homeColor).toBe(DEFAULT_HOME_COLOR);
    expect(loadMatchDraft(memoryStorage()).awayColor).toBe(DEFAULT_AWAY_COLOR);
  });

  it("keeps spaces in an in-progress name until start", () => {
    const storage = memoryStorage();
    const saved = saveMatchDraft({
      ...EMPTY_MATCH_DRAFT,
      title: "Friday Night ",
      homeName: "McBee "
    }, storage);
    expect(saved.title).toBe("Friday Night ");
    expect(saved.homeName).toBe("McBee ");
    expect(commitMatchDraft(saved).title).toBe("Friday Night");
    expect(commitMatchDraft(saved).homeName).toBe("McBee");
  });

  it("fills a whitespace-only name with the default at start", () => {
    const saved = saveMatchDraft({ ...EMPTY_MATCH_DRAFT, homeName: "  " }, memoryStorage());
    expect(saved.homeName).toBe("  ");
    expect(commitMatchDraft(saved).homeName).toBe("Team 1");
  });

  it("accepts high school format", () => {
    expect(parseMatchDraft({ format: "highschool", title: "Region" }).format).toBe("highschool");
    expect(parseMatchDraft({ format: "highschool", title: "Region" }).title).toBe("Region");
  });
});

describe("mergeHomeTeamIntoDraft", () => {
  it("fills Team 1 with the saved home team", () => {
    const next = mergeHomeTeamIntoDraft(EMPTY_MATCH_DRAFT, blazers);
    expect(next.homeName).toBe("Blazers");
    expect(next.homeLogo).toBe(blazers.logo);
    expect(next.awayName).toBe("Team 2");
  });

  it("refreshes color and logo when the home name already matches", () => {
    const next = mergeHomeTeamIntoDraft(
      { ...EMPTY_MATCH_DRAFT, homeName: "Blazers", homeColor: "#111827", homeLogo: "" },
      blazers
    );
    expect(next.homeColor).toBe("#d62828");
    expect(next.homeLogo).toBe(blazers.logo);
  });

  it("leaves a custom home name alone", () => {
    const draft = { ...EMPTY_MATCH_DRAFT, homeName: "Blazers JV" };
    expect(mergeHomeTeamIntoDraft(draft, blazers)).toEqual(draft);
  });
});
