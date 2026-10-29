import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMatch } from "../scoring";

const writes = vi.hoisted(() => ({ setDoc: vi.fn(async (_ref: unknown, _fields: Record<string, unknown>, _options: unknown) => {}) }));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, collection: string, id: string) => `${collection}/${id}`,
  setDoc: writes.setDoc,
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: () => "server-time"
}));
vi.mock("./firebase", () => ({
  getFirebase: () => ({ db: {} }),
  ensureAnonymousAuth: async () => ({ uid: "owner" })
}));
import { createLiveGame, updateLiveBranding, updateLiveScore } from "./games";

describe("isolated live writes", () => {
  beforeEach(() => writes.setDoc.mockClear());
  it("uploads branding without touching score, set gates, theme, or lifecycle", async () => {
    await updateLiveBranding("game", { homeLogo: "https://example.com/new.png", awayLogo: "", scorerName: "Richie" });
    expect(writes.setDoc).toHaveBeenCalledWith("volleyballGames/game", {
      homeLogo: "https://example.com/new.png", scorerName: "Richie", ownerId: "owner",
      updatedAt: "server-time", updatedAtMs: expect.any(Number)
    }, { merge: true });
  });
  it("score writes cannot reopen an ended game", async () => {
    await updateLiveScore("game", createMatch().match);
    expect(writes.setDoc.mock.calls[0][1]).not.toHaveProperty("ended");
  });
  it("only initial creation deliberately opens the game", async () => {
    await createLiveGame("game", createMatch().match, { homeLogo: "", awayLogo: "" });
    expect(writes.setDoc.mock.calls[0][1]).toHaveProperty("ended", false);
  });
});
