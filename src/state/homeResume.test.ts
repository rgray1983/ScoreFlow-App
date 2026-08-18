import { describe, expect, it } from "vitest";
import { shouldPromptLiveReturn, shouldShowResumeMatch } from "./homeResume";

describe("shouldShowResumeMatch", () => {
  it("shows Resume Match for a live session, recovery, or in-progress local match", () => {
    expect(shouldShowResumeMatch({ liveActive: true, hasRecovery: false, matchHasProgress: false })).toBe(true);
    expect(shouldShowResumeMatch({ liveActive: false, hasRecovery: true, matchHasProgress: false })).toBe(true);
    expect(shouldShowResumeMatch({ liveActive: false, hasRecovery: false, matchHasProgress: true })).toBe(true);
    expect(shouldShowResumeMatch({ liveActive: false, hasRecovery: false, matchHasProgress: false })).toBe(false);
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
