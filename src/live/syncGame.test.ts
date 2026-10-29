import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMatch } from "../scoring";
const mock = vi.hoisted(() => ({
  uid: "owner",
  data: undefined as Record<string, unknown> | undefined,
  set: vi.fn(),
}));
vi.mock("./firebase", () => ({
  currentAuthUser: () => ({ uid: mock.uid }),
  getFirebase: () => ({ db: {} }),
}));
vi.mock("firebase/firestore", () => ({
  doc: () => "game",
  serverTimestamp: () => "server",
  runTransaction: async (_db: unknown, run: (tx: unknown) => unknown) =>
    run({
      get: async () => ({ exists: () => !!mock.data, data: () => mock.data }),
      set: mock.set,
    }),
}));
import { sendPendingGame } from "./syncGame";
const job = {
  gameId: "game",
  ownerId: "owner",
  revision: 200,
  ended: false,
  match: createMatch().match,
  branding: { homeLogo: "", awayLogo: "" },
};
describe("server revision and ownership fence", () => {
  beforeEach(() => {
    mock.uid = "owner";
    mock.data = undefined;
    mock.set.mockClear();
  });
  it("creates an absent game with the queued owner and revision", async () => {
    await sendPendingGame(job);
    expect(mock.set.mock.calls[0][1]).toMatchObject({
      ownerId: "owner",
      syncRevision: 200,
      ended: false,
    });
  });
  it("sends the full player feed atomically with the score and terminal end", async () => {
    const plays = [{ id: "p", kind: "ace" as const, side: "home" as const, atMs: 1, player: { id: "one", name: "Sophia", number: "12" } }];
    await sendPendingGame({ ...job, ended: true, plays });
    expect(mock.set.mock.calls[0][1]).toMatchObject({ ended: true, playByPlay: plays });
  });
  it("ignores a delayed older revision", async () => {
    mock.data = { ownerId: "owner", syncRevision: 201 };
    await sendPendingGame(job);
    expect(mock.set).not.toHaveBeenCalled();
  });
  it("never reopens an ended game", async () => {
    mock.data = { ownerId: "owner", syncRevision: 100, ended: true };
    await sendPendingGame(job);
    expect(mock.set).not.toHaveBeenCalled();
  });
  it("rejects account changes and another scorer’s game before writing", async () => {
    mock.uid = "other";
    await expect(sendPendingGame(job)).rejects.toThrow();
    mock.uid = "owner";
    mock.data = { ownerId: "other" };
    await expect(sendPendingGame(job)).rejects.toThrow();
    expect(mock.set).not.toHaveBeenCalled();
  });
  it("writes a pending end with the latest complete score", async () => {
    await sendPendingGame({
      ...job,
      ended: true,
      match: createMatch({ homeScore: 8 }).match,
    });
    expect(mock.set.mock.calls[0][1]).toMatchObject({
      ended: true,
      homeScore: 8,
      syncRevision: 200,
    });
  });
});
