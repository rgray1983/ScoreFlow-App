import { describe, expect, it } from "vitest";
import { consumeResumeIntent, markResumeIntent, shouldPromptLiveReturn, shouldResumeLiveOnMatchPage, shouldReuseLiveGameId, shouldShowResumeMatch } from "./homeResume";

describe("shouldShowResumeMatch", () => {
  it("shows Resume Match for a live session, recovery, or in-progress local match", () => {
    expect(shouldShowResumeMatch({ liveActive: true, hasRecovery: false, matchHasProgress: false })).toBe(true);
    expect(shouldShowResumeMatch({ liveActive: false, hasRecovery: true, matchHasProgress: false })).toBe(true);
    expect(shouldShowResumeMatch({ liveActive: false, hasRecovery: false, matchHasProgress: true })).toBe(true);
    expect(shouldShowResumeMatch({ liveActive: false, hasRecovery: false, matchHasProgress: false })).toBe(false);
  });

  it("hides Resume Match when there is no current match to return to", () => {
    expect(shouldShowResumeMatch({
      liveActive: false,
      hasRecovery: false,
      matchHasProgress: true,
      matchOver: true
    })).toBe(false);
    expect(shouldShowResumeMatch({
      liveActive: true,
      hasRecovery: false,
      matchHasProgress: true,
      matchOver: true
    })).toBe(true);
    expect(shouldShowResumeMatch({
      liveActive: false,
      hasRecovery: false,
      matchHasProgress: true,
      matchOver: false
    })).toBe(true);
  });
});

describe("shouldPromptLiveReturn", () => {
  it("does not block Home after Keep Live in the same session", () => {
    expect(
      shouldPromptLiveReturn({ liveActive: true, hasRecovery: true, returnedToApp: false })
    ).toBe(false);
  });

  it("prompts after the scorer leaves the app and comes back with a live match", () => {
    expect(
      shouldPromptLiveReturn({ liveActive: true, hasRecovery: true, returnedToApp: true })
    ).toBe(true);
    expect(
      shouldPromptLiveReturn({ liveActive: false, hasRecovery: true, returnedToApp: true })
    ).toBe(true);
  });

  it("does not prompt when there is no live match", () => {
    expect(
      shouldPromptLiveReturn({ liveActive: false, hasRecovery: false, returnedToApp: true })
    ).toBe(false);
  });
});

describe("resume intent", () => {
  it("is consumed once so a new match does not auto-reconnect the old live game", () => {
    const storage = memorySession();
    markResumeIntent(storage);
    expect(consumeResumeIntent(storage)).toBe(true);
    expect(consumeResumeIntent(storage)).toBe(false);
  });
});

describe("shouldResumeLiveOnMatchPage", () => {
  it("resumes after Resume Match or a scorer reload when a live recovery exists", () => {
    expect(shouldResumeLiveOnMatchPage({
      hasRecovery: true,
      liveActive: false,
      resumeIntent: true,
      documentReload: false
    })).toBe(true);
    expect(shouldResumeLiveOnMatchPage({
      hasRecovery: true,
      liveActive: false,
      resumeIntent: false,
      documentReload: true
    })).toBe(true);
  });

  it("does not resume a fresh match page with no recovery or an already-live session", () => {
    expect(shouldResumeLiveOnMatchPage({
      hasRecovery: false,
      liveActive: false,
      resumeIntent: true,
      documentReload: true
    })).toBe(false);
    expect(shouldResumeLiveOnMatchPage({
      hasRecovery: true,
      liveActive: true,
      resumeIntent: true,
      documentReload: true
    })).toBe(false);
    expect(shouldResumeLiveOnMatchPage({
      hasRecovery: true,
      liveActive: false,
      resumeIntent: false,
      documentReload: false
    })).toBe(false);
  });
});

describe("shouldReuseLiveGameId", () => {
  it("reuses the recovered id after a reload, but mints a new one after End Match", () => {
    expect(shouldReuseLiveGameId({
      endedThisSession: false,
      gameId: "",
      recoveryId: "id-a"
    })).toBe(true);
    expect(shouldReuseLiveGameId({
      endedThisSession: false,
      gameId: "id-a",
      recoveryId: ""
    })).toBe(true);
    expect(shouldReuseLiveGameId({
      endedThisSession: true,
      gameId: "",
      recoveryId: "id-a"
    })).toBe(false);
    expect(shouldReuseLiveGameId({
      reuseRequested: true,
      endedThisSession: true,
      gameId: "id-a",
      recoveryId: "id-a"
    })).toBe(true);
    expect(shouldReuseLiveGameId({
      endedThisSession: false,
      gameId: "",
      recoveryId: ""
    })).toBe(false);
  });
});

function memorySession() {
  const data = new Map<string, string>();
  return {
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    }
  };
}
