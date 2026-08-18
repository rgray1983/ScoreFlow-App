import { browserStorage, readJson, writeJson, type JsonStorage } from "../storage/local";

export const LIVE_RECOVERY_KEY = "scoreflowLiveRecoveryV1";

export type LiveRecovery = {
  gameId: string;
  active: boolean;
  savedAtMs: number;
  summary: string;
};

export function parseLiveRecovery(value: unknown): LiveRecovery | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const gameId = String(record.gameId || "").trim();
  if (!gameId || record.active !== true) return null;
  return {
    gameId,
    active: true,
    savedAtMs: Number(record.savedAtMs) || Date.now(),
    summary: String(record.summary || "Live match")
  };
}

export function loadLiveRecovery(storage?: JsonStorage): LiveRecovery | null {
  return parseLiveRecovery(readJson(LIVE_RECOVERY_KEY, null, storage));
}

export function saveLiveRecovery(recovery: LiveRecovery, storage?: JsonStorage): void {
  writeJson(LIVE_RECOVERY_KEY, recovery, storage);
}

export function clearLiveRecovery(storage?: JsonStorage): void {
  (storage ?? browserStorage())?.removeItem(LIVE_RECOVERY_KEY);
}

export function liveRecoverySummary(match: {
  matchTitle: string;
  setNumber: number;
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
}): string {
  return `${match.matchTitle} · Set ${match.setNumber} · ${match.homeName} ${match.homeScore}–${match.awayScore} ${match.awayName}`;
}
