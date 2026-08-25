import { describe, expect, it } from "vitest";
import { callTimeout, createMatch, point } from "../scoring";
import { brandingFields, isHttpUrl, parseLiveLogo, scoreFields } from "./payload";

describe("live payloads", () => {
  it("sends scores without embedding logo bytes", () => {
    const scored = point(createMatch({ homeName: "Blazers" }), "home");
    const payload = scoreFields(scored.match);
    expect(payload.homeScore).toBe(1);
    expect(payload.homeName).toBe("Blazers");
    expect(payload.servingSide).toBe("home");
    expect(payload.homeTimeouts).toBe(2);
    expect(payload.awayTimeouts).toBe(2);
    expect(payload.activeTimeout).toBe("");
    expect(payload.timeoutEndsAtMs).toBe(0);
    expect(payload).not.toHaveProperty("homeLogo");
    expect(payload.ended).toBe(false);
  });

  it("sends timeout lights and the clock end time", () => {
    const timed = callTimeout(createMatch({ homeName: "Blazers" }), "home", 1_700_000_000_000);
    const payload = scoreFields(timed.match);
    expect(payload.homeTimeouts).toBe(1);
    expect(payload.awayTimeouts).toBe(2);
    expect(payload.activeTimeout).toBe("home");
    expect(payload.timeoutEndsAtMs).toBe(1_700_000_045_000);
  });

  it("keeps http logos and compact data urls, and omits empty sides", () => {
    expect(isHttpUrl("https://example.com/a.png")).toBe(true);
    expect(isHttpUrl("data:image/png;base64,xx")).toBe(false);
    expect(brandingFields({
      homeLogo: "data:image/png;base64,xx",
      awayLogo: "https://firebasestorage.googleapis.com/v0/b/x/o/home"
    })).toEqual({
      homeLogo: "data:image/png;base64,xx",
      awayLogo: "https://firebasestorage.googleapis.com/v0/b/x/o/home"
    });
    expect(brandingFields({ homeLogo: "", awayLogo: "https://example.com/a.png" })).toEqual({
      awayLogo: "https://example.com/a.png"
    });
    expect(brandingFields({ homeLogo: `data:image/png;base64,${"a".repeat(400_000)}`, awayLogo: "" })).toEqual({});
    expect(brandingFields({
      homeLogo: "",
      awayLogo: "",
      scorerName: "Richie",
      scorerAvatar: "https://example.com/scorer.png"
    })).toEqual({
      scorerName: "Richie",
      scorerAvatar: "https://example.com/scorer.png"
    });
  });

  it("lets the viewer display stored data-url logos", () => {
    expect(parseLiveLogo("https://example.com/home.png")).toBe("https://example.com/home.png");
    expect(parseLiveLogo("data:image/png;base64,xx")).toBe("data:image/png;base64,xx");
    expect(parseLiveLogo("not-a-logo")).toBe("");
  });
});
