import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../storage/local";
import { createMatch } from "../scoring";
import { EMPTY_MATCH_DRAFT } from "../storage/matchSetup";
const mocks = vi.hoisted(() => ({
  send: vi.fn(async (_entry: unknown) => {}),
  owner: "owner",
  authenticate: vi.fn(async () => ({ uid: "owner" })),
}));
vi.mock("../live/syncGame", () => ({ sendPendingGame: mocks.send }));
vi.mock("../live/firebase", () => ({
  firebaseReady: () => true,
  currentAuthUser: () => ({ uid: mocks.owner }),
  ensureAnonymousAuth: () => mocks.authenticate(),
  watchAuth: () => () => {},
}));
vi.mock("../live", async (original) => ({
  ...(await original<typeof import("../live")>()),
  writePresence: async () => {},
  listenViewerCount: () => () => {},
}));
describe("live session recovery lifecycle", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("window", {
      setInterval: () => 1,
      clearInterval() {},
      setTimeout,
      clearTimeout,
      addEventListener() {},
    });
    vi.stubGlobal("navigator", { onLine: false });
    mocks.owner = "owner";
    mocks.send.mockClear();
    mocks.authenticate.mockImplementation(async () => ({ uid: mocks.owner }));
  });
  it("starts with a cached identity offline, saves rallies, and ends without waiting for a network", async () => {
    const { useLiveSession } = await import("./liveSession");
    await useLiveSession
      .getState()
      .goLive(createMatch().match, EMPTY_MATCH_DRAFT);
    expect(useLiveSession.getState().active).toBe(true);
    const id = useLiveSession.getState().gameId;
    useLiveSession.getState().publishScore(createMatch({ homeScore: 9 }).match);
    await useLiveSession.getState().endLive();
    const saved = JSON.parse(localStorage.getItem("scoreflowLiveOutboxV1")!);
    expect(saved.entries[0]).toMatchObject({
      gameId: id,
      ended: true,
      match: { homeScore: 9 },
    });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(useLiveSession.getState().active).toBe(false);
  });
  it("does not adopt another account’s saved link", async () => {
    const { useLiveSession } = await import("./liveSession");
    await useLiveSession
      .getState()
      .goLive(createMatch().match, EMPTY_MATCH_DRAFT);
    const match = createMatch({ homeScore: 3 }).match;
    mocks.owner = "other";
    await useLiveSession.getState().resumeLive(match, EMPTY_MATCH_DRAFT);
    expect(useLiveSession.getState().status).toBe("error");
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("keeps one ID when Share is tapped during connection", async () => {
    let finish!: () => void;
    mocks.authenticate.mockImplementation(async () => {
      await new Promise<void>((r) => {
        finish = r;
      });
      return { uid: "owner" };
    });
    const { useLiveSession } = await import("./liveSession");
    const first = useLiveSession
      .getState()
      .goLive(createMatch().match, EMPTY_MATCH_DRAFT);
    const id = useLiveSession.getState().gameId;
    await useLiveSession
      .getState()
      .goLive(createMatch().match, EMPTY_MATCH_DRAFT);
    expect(useLiveSession.getState().gameId).toBe(id);
    finish();
    await first;
  });
  it("queues the latest point entered while connecting", async () => {
    let finish!: () => void;
    mocks.authenticate.mockImplementation(async () => {
      await new Promise<void>((r) => {
        finish = r;
      });
      return { uid: "owner" };
    });
    const { useLiveSession } = await import("./liveSession");
    const pending = useLiveSession
      .getState()
      .goLive(createMatch().match, EMPTY_MATCH_DRAFT);
    useLiveSession.getState().publishScore(createMatch({ homeScore: 5 }).match);
    finish();
    await pending;
    expect(
      JSON.parse(localStorage.getItem("scoreflowLiveOutboxV1")!).entries[0]
        .match.homeScore,
    ).toBe(5);
  });
  it("cancels a fresh link ended while authentication is in flight", async () => {
    let finish!: () => void;
    mocks.authenticate.mockImplementation(async () => {
      await new Promise<void>((r) => {
        finish = r;
      });
      return { uid: "owner" };
    });
    const { useLiveSession } = await import("./liveSession");
    const pending = useLiveSession
      .getState()
      .goLive(createMatch().match, EMPTY_MATCH_DRAFT);
    await useLiveSession.getState().endLive();
    finish();
    await pending;
    expect(useLiveSession.getState().active).toBe(false);
    expect(localStorage.getItem("scoreflowLiveOutboxV1")).toBeNull();
  });
  it("retains an old offline end while a new match gets a fresh link", async () => {
    const { useLiveSession } = await import("./liveSession");
    await useLiveSession
      .getState()
      .goLive(createMatch().match, EMPTY_MATCH_DRAFT);
    const old = useLiveSession.getState().gameId;
    await useLiveSession.getState().endLive();
    await useLiveSession
      .getState()
      .goLive(createMatch().match, EMPTY_MATCH_DRAFT);
    expect(useLiveSession.getState().gameId).not.toBe(old);
    expect(
      JSON.parse(localStorage.getItem("scoreflowLiveOutboxV1")!).entries,
    ).toHaveLength(2);
  });
});
