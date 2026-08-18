import { describe, expect, it } from "vitest";
import { memoryStorage } from "../storage/local";
import { clearLiveRecovery, loadLiveRecovery, parseLiveRecovery, saveLiveRecovery } from "./recovery";

describe("live recovery", () => {
  it("saves an active game id", () => {
    const storage = memoryStorage();
    saveLiveRecovery({
      gameId: "abc123",
      active: true,
      savedAtMs: 1,
      summary: "Region · Set 2 · Blazers 10–8 Eastside"
    }, storage);
    expect(loadLiveRecovery(storage)?.gameId).toBe("abc123");
  });

  it("ignores inactive or blank records", () => {
    expect(parseLiveRecovery({ gameId: "x", active: false })).toBeNull();
    expect(parseLiveRecovery({ gameId: "", active: true })).toBeNull();
  });

  it("clears recovery", () => {
    const storage = memoryStorage();
    saveLiveRecovery({ gameId: "abc123", active: true, savedAtMs: 1, summary: "Live" }, storage);
    clearLiveRecovery(storage);
    expect(loadLiveRecovery(storage)).toBeNull();
  });
});
