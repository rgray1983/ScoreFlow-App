import type { HighlightCall, MatchEngine } from "./types";

// The undo history already identifies every surviving scoring action. Derive the
// feed from it rather than storing a growing feed in every history snapshot.
export function matchPlays(engine: MatchEngine | null): HighlightCall[] {
  const plays = new Map<string, HighlightCall>();
  if (!engine) return [];
  for (const state of [...engine.history, engine.match]) {
    const call = state.lastHighlight;
    if (call?.side === "home" && call.player?.name) plays.set(call.id, call);
  }
  return [...plays.values()];
}
export function playText(call: HighlightCall): string {
  const player = call.player;
  return `${player?.number ? `#${player.number} ` : ""}${player?.name || "Team"} — ${call.kind[0].toUpperCase()}${call.kind.slice(1)}!`;
}
