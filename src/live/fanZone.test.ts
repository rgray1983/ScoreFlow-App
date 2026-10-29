import { describe, expect, it } from "vitest";
import {
  chatNameStorageKey,
  mergeChatMessages,
  chatWindowHasGap,
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
  it("merges paginated and live messages without duplicates or losing earlier messages, with stable timestamp ties", () => {
    const a = parseChatMessage("a", { text: "old", createdAtMs: 1 })!;
    const b = parseChatMessage("b", { text: "b", createdAtMs: 2 })!;
    const c = parseChatMessage("c", { text: "c", createdAtMs: 2 })!;
    expect(mergeChatMessages([c, a], [b, c])).toEqual([a, b, c]);
  });
  it("detects a missing reconnect window so older-page loading cannot skip messages", () => {
    const messages = Array.from({ length: 90 }, (_, i) => parseChatMessage(String(i), { text: String(i), createdAtMs: i + 1 })!);
    expect(chatWindowHasGap(messages.slice(0, 40), messages.slice(1, 41))).toBe(false);
    expect(chatWindowHasGap(messages.slice(0, 40), messages.slice(50, 90))).toBe(true);
    expect(chatWindowHasGap([], messages.slice(50, 90))).toBe(false);
  });
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
