import { describe, expect, it } from "vitest";
import {
  chatNameStorageKey,
  cleanChatName,
  cleanChatText,
  isFreshFanEvent,
  isReactionEmoji,
  loadViewerChatName,
  parseChatMessage,
  parseReaction,
  saveViewerChatName,
  viewerSessionId
} from "./fanZone";

describe("fan zone", () => {
  it("trims chat names and texts to the rule limits", () => {
    expect(cleanChatName("  Go  Blazers  ")).toBe("Go Blazers");
    expect(cleanChatName("x".repeat(40))).toHaveLength(24);
    expect(cleanChatText("  Let's go!  ")).toBe("Let's go!");
    expect(cleanChatText("x".repeat(80))).toHaveLength(60);
  });

  it("accepts only the ScoreFlow reaction set", () => {
    expect(isReactionEmoji("🏐")).toBe(true);
    expect(isReactionEmoji("💩")).toBe(false);
  });

  it("parses chat and reaction documents", () => {
    const message = parseChatMessage("m1", {
      text: "Nice serve",
      name: "Sam",
      role: "viewer",
      sessionId: "session-1",
      uid: "u1",
      createdAtMs: 99
    });
    expect(message).toMatchObject({
      id: "m1",
      text: "Nice serve",
      name: "Sam",
      role: "viewer"
    });
    expect(parseReaction("r1", { emoji: "🔥", uid: "u1", createdAtMs: 12 })).toEqual({
      id: "r1",
      emoji: "🔥",
      uid: "u1",
      createdAtMs: 12
    });
    expect(parseReaction("r2", { emoji: "nope", uid: "u1", createdAtMs: 12 })).toBeNull();
  });

  it("keeps a viewer chat name on this device only", () => {
    const storage = new Map<string, string>();
    const api = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      }
    };
    const sessionId = viewerSessionId(api);
    expect(sessionId.startsWith("session-")).toBe(true);
    expect(saveViewerChatName("game-a", "  Riley  ", sessionId, api)).toBe("Riley");
    expect(loadViewerChatName("game-a", sessionId, api)).toBe("Riley");
    expect(storage.get(chatNameStorageKey("game-a", sessionId))).toBe("Riley");
  });

  it("treats recent fan events as fresh for toasts and floats", () => {
    expect(isFreshFanEvent(1000, 2000)).toBe(true);
    expect(isFreshFanEvent(1000, 20000)).toBe(false);
    expect(isFreshFanEvent(0, 2000)).toBe(false);
  });
});
