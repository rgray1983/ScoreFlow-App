import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMatch } from "../scoring";
import { EMPTY_MATCH_DRAFT } from "../storage/matchSetup";
import type { LiveRecovery } from "../live";

const liveMocks = vi.hoisted(() => {
  let stored: LiveRecovery | null = null;
  let idIndex = 0;
  const ids = ["id-a", "id-b", "id-c"];
  return {
    stored: () => stored,
    setStored(value: LiveRecovery | null) {
      stored = value;
    },
    reset() {
      stored = null;
      idIndex = 0;
    },
    firebaseReady: vi.fn(() => true),
    createGameId: vi.fn(() => ids[idIndex++] || `id-${idIndex}`),
    createLiveGame: vi.fn(async (_gameId: string, _match: unknown, _logos: unknown) => {}),
    endLiveGame: vi.fn(async () => {}),
    updateLiveScore: vi.fn(async () => {}),
    updateLiveBranding: vi.fn(async () => {}),
    uploadMatchLogos: vi.fn(async () => ({ homeLogo: "", awayLogo: "" })),
    writePresence: vi.fn(async () => {}),
    listenViewerCount: vi.fn(() => vi.fn()),
    loadLiveRecovery: vi.fn(() => stored),
    saveLiveRecovery: vi.fn((recovery: LiveRecovery) => {
      stored = recovery;
    }),
    clearLiveRecovery: vi.fn(() => {
      stored = null;
    })
  };
});

vi.mock("../live", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../live")>();
  return {
    ...actual,
    firebaseReady: liveMocks.firebaseReady,
    createGameId: liveMocks.createGameId,
    createLiveGame: liveMocks.createLiveGame,
    endLiveGame: liveMocks.endLiveGame,
    updateLiveScore: liveMocks.updateLiveScore,
    updateLiveBranding: liveMocks.updateLiveBranding,
    uploadMatchLogos: liveMocks.uploadMatchLogos,
    writePresence: liveMocks.writePresence,
    listenViewerCount: liveMocks.listenViewerCount,
    loadLiveRecovery: liveMocks.loadLiveRecovery,
    saveLiveRecovery: liveMocks.saveLiveRecovery,
    clearLiveRecovery: liveMocks.clearLiveRecovery
  };
});

import { useLiveSession } from "./liveSession";

const match = createMatch().match;
const draft = { ...EMPTY_MATCH_DRAFT };

function resetSession(): void {
  liveMocks.reset();
  useLiveSession.setState({
    status: "offline",
    active: false,
    epoch: 0,
    gameId: "",
    viewerCount: 0,
    error: "",
    shareOpen: false,
    recovery: null
  });
}

describe("live session", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
    vi.useFakeTimers();
    resetSession();
    liveMocks.createLiveGame.mockClear();
    liveMocks.endLiveGame.mockClear();
    liveMocks.updateLiveScore.mockClear();
    liveMocks.updateLiveBranding.mockClear();
    liveMocks.createGameId.mockClear();
    liveMocks.saveLiveRecovery.mockClear();
    liveMocks.clearLiveRecovery.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("mints a new game id after endLive so the next share is not the ended game", async () => {
    await useLiveSession.getState().goLive(match, draft);
    const firstId = useLiveSession.getState().gameId;
    expect(firstId).toBe("id-a");
    expect(useLiveSession.getState().active).toBe(true);

    await useLiveSession.getState().endLive();
    expect(useLiveSession.getState()).toMatchObject({
      status: "offline",
      active: false,
      gameId: "",
      recovery: null
    });
    expect(liveMocks.endLiveGame).toHaveBeenCalledWith("id-a");
    expect(liveMocks.stored()).toBeNull();

    await useLiveSession.getState().goLive(match, draft);
    expect(useLiveSession.getState().gameId).toBe("id-b");
    expect(useLiveSession.getState().active).toBe(true);
    expect(liveMocks.createLiveGame).toHaveBeenLastCalledWith("id-b", match, { homeLogo: "", awayLogo: "" });
  });

  it("does not reuse a leftover recovery id after the match was ended", async () => {
    await useLiveSession.getState().goLive(match, draft);
    await useLiveSession.getState().endLive();
    liveMocks.setStored({ gameId: "id-a", active: true, savedAtMs: 1, summary: "Old live" });
    useLiveSession.setState({ recovery: liveMocks.stored() });

    await useLiveSession.getState().goLive(match, draft);
    expect(useLiveSession.getState().gameId).toBe("id-b");
    expect(liveMocks.createLiveGame.mock.calls.map((call) => call[0])).toEqual(["id-a", "id-b"]);
  });

  it("keeps the same game id when Share Live is tapped while already live", async () => {
    await useLiveSession.getState().goLive(match, draft);
    liveMocks.createLiveGame.mockClear();
    await useLiveSession.getState().goLive(match, draft);
    expect(useLiveSession.getState().gameId).toBe("id-a");
    expect(liveMocks.createLiveGame).not.toHaveBeenCalled();
    expect(useLiveSession.getState().shareOpen).toBe(true);
  });

  it("resumes the recovered game id instead of minting a new one", async () => {
    liveMocks.setStored({ gameId: "id-a", active: true, savedAtMs: 1, summary: "Live" });
    useLiveSession.setState({ recovery: liveMocks.stored() });
    await useLiveSession.getState().resumeLive(match, draft);
    expect(useLiveSession.getState().gameId).toBe("id-a");
    expect(liveMocks.createLiveGame).toHaveBeenCalledWith("id-a", match, { homeLogo: "", awayLogo: "" });
  });

  it("drops a pending score publish so endLive cannot resurrect Keep Live", async () => {
    await useLiveSession.getState().goLive(match, draft);
    useLiveSession.getState().publishScore(match);
    await useLiveSession.getState().endLive();
    await vi.advanceTimersByTimeAsync(250);
    expect(liveMocks.updateLiveScore).not.toHaveBeenCalled();
    expect(useLiveSession.getState().status).toBe("offline");
    expect(useLiveSession.getState().active).toBe(false);
    expect(liveMocks.stored()).toBeNull();
  });

  it("ignores an in-flight score write that finishes after endLive", async () => {
    let finishWrite: (() => void) | undefined;
    liveMocks.updateLiveScore.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        })
    );
    await useLiveSession.getState().goLive(match, draft);
    useLiveSession.getState().publishScore(match);
    await vi.advanceTimersByTimeAsync(120);
    expect(liveMocks.updateLiveScore).toHaveBeenCalledOnce();

    await useLiveSession.getState().endLive();
    finishWrite?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(useLiveSession.getState().status).toBe("offline");
    expect(useLiveSession.getState().active).toBe(false);
    expect(liveMocks.stored()).toBeNull();
  });
});
