import { describe, expect, it } from "vitest";
import { createMatch } from "../scoring";
import { prematchMeta } from "./PrematchOverlay";

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
