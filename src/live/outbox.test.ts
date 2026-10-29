import { describe, expect, it } from "vitest";
import { LiveOutbox } from "./outbox";
import { memoryStorage } from "../storage/local";
import { createMatch } from "../scoring";
const job = {
  gameId: "game",
  ownerId: "owner",
  ended: false,
  match: createMatch().match,
  branding: { homeLogo: "", awayLogo: "" },
};
describe("durable live outbox", () => {
  it("coalesces offline rallies and recovers the latest complete state after reload", async () => {
    const storage = memoryStorage();
    const sent: unknown[] = [];
    const queue = new LiveOutbox(
      storage,
      async (e) => {
        sent.push(e);
      },
      () => "owner",
      () => false,
    );
    queue.enqueue(job);
    queue.enqueue({
      ...job,
      match: createMatch({
        homeScore: 7,
        servingSide: "home",
        boardTheme: "flip-clock",
        timeoutEndsAtMs: 123456,
      }).match,
    });
    await queue.flush();
    expect(sent).toEqual([]);
    expect(queue.pending()).toHaveLength(1);
    const reloaded = new LiveOutbox(
      storage,
      async (e) => {
        sent.push(e);
      },
      () => "owner",
      () => true,
    );
    await reloaded.flush();
    expect(sent).toHaveLength(1);
    expect(reloaded.pending()).toHaveLength(0);
    expect((sent[0] as typeof job).match).toMatchObject({
      homeScore: 7,
      servingSide: "home",
      boardTheme: "flip-clock",
      timeoutEndsAtMs: 123456,
    });
  });
  it("an old acknowledgement cannot discard a newer point or pending end", async () => {
    let finish: (() => void) | undefined;
    let calls = 0;
    const queue = new LiveOutbox(
      memoryStorage(),
      async () => {
        if (++calls === 1)
          await new Promise<void>((r) => {
            finish = r;
          });
      },
      () => "owner",
      () => true,
    );
    queue.enqueue(job);
    const flushing = queue.flush();
    queue.enqueue({ ...job, ended: true });
    queue.enqueue({ ...job, match: createMatch({ homeScore: 10 }).match });
    expect(queue.pending()[0].ended).toBe(true);
    finish!();
    await flushing;
    expect(calls).toBe(2);
    expect(queue.pending()).toEqual([]);
  });
  it("retains failures for retry and refuses to flush as a different account", async () => {
    let owner = "other";
    let fail = true;
    let calls = 0;
    const queue = new LiveOutbox(
      memoryStorage(),
      async () => {
        calls++;
        if (fail) throw Error("offline");
      },
      () => owner,
      () => true,
    );
    queue.enqueue(job);
    await queue.flush();
    expect(calls).toBe(0);
    owner = "owner";
    await queue.flush();
    expect(queue.pending()).toHaveLength(1);
    fail = false;
    await queue.flush();
    expect(queue.pending()).toEqual([]);
  });
  it("does not lose the old entry or claim a durable save when storage is full", () => {
    const queue = new LiveOutbox(
      {
        getItem: () => null,
        removeItem() {},
        setItem() {
          throw Error("quota");
        },
      },
      async () => {},
      () => "owner",
      () => true,
    );
    expect(() => queue.enqueue(job)).toThrow("quota");
    expect(queue.pending()).toEqual([]);
  });
  it("keeps a pending end after reload and does not reopen it with a stale score", () => {
    const storage = memoryStorage();
    const queue = new LiveOutbox(
      storage,
      async () => {},
      () => "owner",
      () => false,
    );
    queue.enqueue({ ...job, ended: true });
    const restored = new LiveOutbox(
      storage,
      async () => {},
      () => "owner",
      () => false,
    );
    restored.enqueue(job);
    expect(restored.pending()[0].ended).toBe(true);
  });
});
