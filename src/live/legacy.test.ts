import { describe, expect, it } from "vitest";
import { legacyLivePath } from "./legacy";

describe("legacyLivePath", () => {
  it("sends old viewer query links to /g/:gameId", () => {
    expect(legacyLivePath("?game=game-abc-123&mode=view")).toBe("/g/game-abc-123");
    expect(legacyLivePath("game=abc")).toBe("/g/abc");
  });

  it("sends old scorer query links to /match", () => {
    expect(legacyLivePath("?game=game-abc-123&mode=scorer")).toBe("/match");
  });

  it("ignores urls without a game id", () => {
    expect(legacyLivePath("")).toBeNull();
    expect(legacyLivePath("mode=view")).toBeNull();
  });
});
