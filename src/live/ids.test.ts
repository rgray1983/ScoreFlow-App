import { describe, expect, it } from "vitest";
import { createGameId, isGameId, viewerPath, viewerUrl } from "./ids";

describe("createGameId", () => {
  it("returns an unguessable 128-bit hex id", () => {
    const id = createGameId();
    expect(isGameId(id)).toBe(true);
    expect(id.startsWith("game-")).toBe(false);
    expect(id).not.toContain(String(Date.now()).slice(0, 6));
  });

  it("does not collide in a small sample", () => {
    const ids = new Set(Array.from({ length: 40 }, () => createGameId()));
    expect(ids.size).toBe(40);
  });
});

describe("viewer links", () => {
  it("uses the /g/:gameId route", () => {
    expect(viewerPath("abc")).toBe("/g/abc");
    expect(viewerUrl("abc", "https://scoreflow.app")).toBe("https://scoreflow.app/g/abc");
  });
});
