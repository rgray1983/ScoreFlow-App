import { parseMatchState } from "../storage/matchEngine";
import { browserStorage, type JsonStorage } from "../storage/local";
import type { MatchState } from "../scoring";
import type { LiveBranding } from "./payload";

export type PendingGame = {
  gameId: string;
  ownerId: string;
  revision: number;
  ended: boolean;
  match: MatchState;
  branding: LiveBranding;
};
export const OUTBOX_KEY = "scoreflowLiveOutboxV1";

// One latest snapshot per game; an end is terminal. Acknowledgements remove only
// the exact revision sent, never a newer rally entered during an in-flight write.
export class LiveOutbox {
  private entries: PendingGame[] = [];
  private revision = 0;
  private running: Promise<void> | null = null;
  error = "";
  constructor(
    private storage: JsonStorage | null,
    private send: (entry: PendingGame) => Promise<void>,
    private owner: () => string | null,
    private online: () => boolean,
    private changed: () => void = () => {},
  ) {
    try {
      const saved = JSON.parse(storage?.getItem(OUTBOX_KEY) || "{}");
      this.revision = Number(saved.revision) || 0;
      this.entries = (
        Array.isArray(saved.entries) ? saved.entries : []
      ).flatMap((entry: PendingGame) => {
        const match = parseMatchState(entry.match);
        return match &&
          typeof entry.gameId === "string" &&
          typeof entry.ownerId === "string" &&
          entry.ownerId &&
          Number.isFinite(entry.revision)
          ? [{ ...entry, match, branding: entry.branding || {} }]
          : [];
      });
    } catch {
      this.error = "Saved live updates could not be read.";
    }
  }
  pending(gameId?: string) {
    return this.entries.filter((entry) => !gameId || entry.gameId === gameId);
  }
  private persist() {
    if (!this.storage)
      throw new Error(
        "Device storage is unavailable. Live updates could not be saved.",
      );
    this.storage.setItem(
      OUTBOX_KEY,
      JSON.stringify({ revision: this.revision, entries: this.entries }),
    );
  }
  enqueue(input: Omit<PendingGame, "revision">) {
    const previous = this.entries;
    const existing = previous.find((entry) => entry.gameId === input.gameId);
    if (existing?.ended || (existing && existing.ownerId !== input.ownerId))
      return;
    this.revision = Math.max(Date.now(), this.revision + 1);
    const next = {
      ...input,
      branding: { ...existing?.branding, ...input.branding },
      revision: this.revision,
    };
    this.entries = [
      ...previous.filter((entry) => entry.gameId !== input.gameId),
      next,
    ];
    try {
      this.persist();
      this.error = "";
    } catch (error) {
      this.entries = previous;
      throw error;
    }
    this.changed();
  }
  flush(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.drain().finally(() => {
      this.running = null;
      this.changed();
    });
    return this.running;
  }
  private async drain() {
    const failed = new Set<string>();
    while (this.online()) {
      const entry = this.entries.find(
        (item) => item.ownerId === this.owner() && !failed.has(item.gameId),
      );
      if (!entry) break;
      try {
        await this.send(entry);
        const previous = this.entries;
        this.entries = previous.filter(
          (item) =>
            item.gameId !== entry.gameId || item.revision !== entry.revision,
        );
        try {
          this.persist();
        } catch (error) {
          this.entries = previous;
          throw error;
        }
        this.error = "";
        this.changed();
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "Live updates are waiting to sync.";
        failed.add(entry.gameId);
      }
    }
  }
}
export function deviceOutboxStorage() {
  return browserStorage();
}
