import type { Command, MatchEngine } from "../scoring";

export const SOUND_CUES = ["point", "ace", "kill", "block", "heating-up", "on-fire", "timeout"] as const;
export type SoundCue = typeof SOUND_CUES[number];
export type SoundEvent = { id: string; atMs: number; cues: SoundCue[]; remote?: boolean };

export function parseSoundEvent(value: unknown): SoundEvent | null {
  if (!value || typeof value !== "object") return null;
  const event = value as Record<string, unknown>;
  if (typeof event.id !== "string" || !event.id || event.id.length > 80 ||
    typeof event.atMs !== "number" || !Number.isFinite(event.atMs) || event.atMs <= 0 ||
    !Array.isArray(event.cues) || event.cues.length < 1 || event.cues.length > 2 ||
    !event.cues.every((cue) => SOUND_CUES.includes(cue as SoundCue))) return null;
  return { id: event.id, atMs: event.atMs, cues: [...event.cues] as SoundCue[], ...(event.remote === false ? { remote: false } : {}) };
}

// Attach presentation metadata after the reducer accepts an action. It travels
// with the same durable score snapshot, never through a separate network write.
export function withSoundEvent(previous: MatchEngine, next: MatchEngine, command: Command,
  stamp: () => { id: string; atMs: number; remote?: boolean }): MatchEngine {
  if (next === previous) return next;
  let cues: SoundCue[] = [];
  if (command.type === "timeout") cues = ["timeout"];
  if (command.type === "point" || command.type === "highlight") {
    const side = command.type === "point" ? command.side : command.call.side;
    cues = [command.type === "highlight" && !command.call.player ? command.call.kind : "point"];
    const run = previous.match.runSide === side ? previous.match.runLength + 1 : 1;
    if (run === 4) cues.push("heating-up");
    if (run === 7) cues.push("on-fire");
  }
  if (cues.length) return { ...next, match: { ...next.match, lastSound: { ...stamp(), cues } } };
  if (["undo", "subtract", "newMatch", "applyFormat"].includes(command.type)) {
    return { ...next, match: { ...next.match, lastSound: null } };
  }
  return next;
}

// No initial history, duplicates, expired events or catch-up on reconnect. The
// caller observes even muted/inactive snapshots so enabling never replays them.
export class SoundCursor {
  private session = "";
  private initialized = false;
  private active = false;
  private seen = new Set<string>();
  private quietThroughMs = 0;
  silenceThrough(nowMs: number) {
    this.active = false;
    this.quietThroughMs = Math.max(this.quietThroughMs, nowMs);
  }
  take(session: string, event: SoundEvent | null | undefined, active: boolean, nowMs: number, remoteOnly = false): SoundCue[] {
    const baseline = !this.initialized || this.session !== session || !this.active;
    if (this.session !== session) { this.seen.clear(); this.quietThroughMs = 0; }
    this.initialized = true; this.session = session; this.active = active;
    if (!event || this.seen.has(event.id)) return [];
    this.seen.add(event.id);
    if (baseline || !active || (remoteOnly && event.remote === false) || event.atMs <= this.quietThroughMs || nowMs < event.atMs || nowMs - event.atMs > 5000) return [];
    return event.cues;
  }
}
