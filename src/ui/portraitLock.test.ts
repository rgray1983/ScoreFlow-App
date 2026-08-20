import { afterEach, describe, expect, it, vi } from "vitest";
import { lockPortraitOrientation, unlockOrientation } from "./portraitLock";

describe("portraitLock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("locks portrait when the Screen Orientation API is available", async () => {
    const lock = vi.fn(async () => {});
    vi.stubGlobal("screen", { orientation: { lock, unlock: vi.fn() } });
    await expect(lockPortraitOrientation()).resolves.toBe(true);
    expect(lock).toHaveBeenCalledWith("portrait");
  });

  it("returns false when lock is missing", async () => {
    vi.stubGlobal("screen", { orientation: {} });
    await expect(lockPortraitOrientation()).resolves.toBe(false);
  });

  it("falls back to portrait-primary when portrait is denied", async () => {
    const lock = vi.fn(async (type: string) => {
      if (type === "portrait") throw new Error("denied");
    });
    vi.stubGlobal("screen", { orientation: { lock } });
    await expect(lockPortraitOrientation()).resolves.toBe(true);
    expect(lock).toHaveBeenCalledWith("portrait-primary");
  });

  it("unlocks without throwing when the API is absent", () => {
    vi.stubGlobal("screen", {});
    expect(() => unlockOrientation()).not.toThrow();
  });
});
