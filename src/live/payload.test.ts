import { describe, expect, it } from "vitest";
import { createMatch, point } from "../scoring";
import { brandingFields, isHttpUrl, scoreFields } from "./payload";

describe("live payloads", () => {
  it("sends scores without embedding logo bytes", () => {
    const scored = point(createMatch({ homeName: "Blazers" }), "home");
    const payload = scoreFields(scored.match);
    expect(payload.homeScore).toBe(1);
    expect(payload.homeName).toBe("Blazers");
    expect(payload).not.toHaveProperty("homeLogo");
    expect(payload.ended).toBe(false);
  });

  it("only keeps http logo urls", () => {
    expect(isHttpUrl("https://example.com/a.png")).toBe(true);
    expect(isHttpUrl("data:image/png;base64,xx")).toBe(false);
    expect(brandingFields({
      homeLogo: "data:image/png;base64,xx",
      awayLogo: "https://firebasestorage.googleapis.com/v0/b/x/o/home"
    })).toEqual({
      homeLogo: "",
      awayLogo: "https://firebasestorage.googleapis.com/v0/b/x/o/home"
    });
  });
});
