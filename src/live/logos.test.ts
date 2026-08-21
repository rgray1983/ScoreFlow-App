import { describe, expect, it } from "vitest";
import { compactLiveLogo, compactLiveLogos, resolveLiveLogos } from "./logos";

describe("live logos", () => {
  it("keeps http urls and compact data urls for the live document", async () => {
    await expect(compactLiveLogo("https://example.com/home.png")).resolves.toBe("https://example.com/home.png");
    await expect(compactLiveLogo("data:image/png;base64,xx")).resolves.toBe("data:image/png;base64,xx");
    await expect(compactLiveLogo("")).resolves.toBe("");
    await expect(compactLiveLogos({
      homeLogo: "data:image/png;base64,xx",
      awayLogo: "https://example.com/away.png"
    })).resolves.toEqual({
      homeLogo: "data:image/png;base64,xx",
      awayLogo: "https://example.com/away.png"
    });
  });

  it("prefers uploaded storage urls and falls back to a compact draft logo", () => {
    expect(resolveLiveLogos(
      { homeLogo: "https://storage.example/home", awayLogo: "" },
      { homeLogo: "data:image/png;base64,xx", awayLogo: "data:image/png;base64,yy" }
    )).toEqual({
      homeLogo: "https://storage.example/home",
      awayLogo: "data:image/png;base64,yy"
    });
  });
});
