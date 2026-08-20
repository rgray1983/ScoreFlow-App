import { describe, expect, it } from "vitest";
import { memoryStorage } from "./local";
import { FREE_MATCH_HISTORY_LIMIT } from "./matchHistory";
import {
  DEFAULT_PREMIUM,
  PREMIUM_KEY,
  PRO_MATCH_HISTORY_LIMIT,
  loadPremium,
  matchHistoryLimit,
  normalizeResultBackground,
  normalizeTheme,
  parsePremium,
  resultsBackgroundSrc,
  savePremium,
  toggleProPreview
} from "./premium";

describe("premium settings", () => {
  it("parses the current-app premium shape and forces backup off unless Pro", () => {
    const premium = parsePremium({
      isPro: false,
      theme: "neon",
      posterStyle: "championship",
      resultBackground: "water-color",
      cloudBackup: true
    });
    expect(premium).toEqual({
      isPro: false,
      theme: "classic",
      posterStyle: "classic",
      resultBackground: "default",
      cloudBackup: false
    });
  });

  it("keeps Pro themes and backgrounds when Pro is on", () => {
    const premium = parsePremium({
      isPro: true,
      theme: "fire",
      posterStyle: "neon",
      resultBackground: "gold-bracket",
      cloudBackup: true
    });
    expect(premium.theme).toBe("fire");
    expect(premium.resultBackground).toBe("gold-bracket");
    expect(premium.cloudBackup).toBe(true);
    expect(matchHistoryLimit(premium)).toBe(PRO_MATCH_HISTORY_LIMIT);
  });

  it("falls unknown ids back to classic/default", () => {
    expect(normalizeTheme("nope", true)).toBe("classic");
    expect(normalizeResultBackground("nope", true)).toBe("default");
    expect(resultsBackgroundSrc("blue-wave")).toBe("/images/results/blue-wave.png");
    expect(resultsBackgroundSrc("missing")).toBe("/images/results/default.jpg");
  });

  it("round-trips local storage with the current-app key", () => {
    const storage = memoryStorage();
    const saved = savePremium({
      ...DEFAULT_PREMIUM,
      isPro: true,
      theme: "ice",
      resultBackground: "neon-lights",
      cloudBackup: true
    }, storage);
    expect(JSON.parse(storage.getItem(PREMIUM_KEY) || "{}")).toMatchObject({
      isPro: true,
      theme: "ice",
      resultBackground: "neon-lights"
    });
    expect(loadPremium(storage)).toEqual(saved);
  });

  it("toggles the Pro preview and resets locked choices when leaving Pro", () => {
    const unlocked = toggleProPreview(DEFAULT_PREMIUM);
    expect(unlocked.isPro).toBe(true);
    expect(unlocked.cloudBackup).toBe(true);
    expect(matchHistoryLimit(DEFAULT_PREMIUM)).toBe(FREE_MATCH_HISTORY_LIMIT);

    const locked = toggleProPreview({
      isPro: true,
      theme: "championship",
      posterStyle: "championship",
      resultBackground: "power-hitter",
      cloudBackup: true
    });
    expect(locked).toEqual({
      isPro: false,
      theme: "classic",
      posterStyle: "classic",
      resultBackground: "default",
      cloudBackup: false
    });
  });
});
