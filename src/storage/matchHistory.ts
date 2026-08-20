import type { CompletedSet, MatchFormat, MatchState, Side } from "../scoring";
import { DEFAULT_AWAY_COLOR, DEFAULT_HOME_COLOR, normalizeHex } from "../lib/color";
import { parseCompletedSet } from "./matchEngine";
import { readJson, writeJson, type JsonStorage } from "./local";

export const MATCH_HISTORY_KEY = "scoreflowMatchHistoryV2";
export const FREE_MATCH_HISTORY_LIMIT = 3;

export type HistoryMatch = {
  id: string;
  title: string;
  homeName: string;
  awayName: string;
  homeSets: number;
  awaySets: number;
  winner: string;
  winnerSide: Side;
  homeLogo: string;
  awayLogo: string;
  homeColor: string;
  awayColor: string;
  completedSets: CompletedSet[];
  matchFormat: MatchFormat;
  matchSets: number;
  resultBackground: string;
  updatedAtMs: number;
};

let lastSavedWinnerKey = "";

export function resetHistorySaveGuard() {
  lastSavedWinnerKey = "";
}

export function winnerSaveKey(match: Pick<MatchState, "winner" | "homeSets" | "awaySets" | "completedSets">): string {
  return `${match.winner}-${match.homeSets}-${match.awaySets}-${match.completedSets.length}`;
}

export function matchSetCount(match: Pick<HistoryMatch, "matchSets" | "matchFormat">): number {
  const explicit = Number(match.matchSets || 0);
  if (explicit === 5 || explicit === 3) return explicit;
  return match.matchFormat === "highschool" ? 5 : 3;
}

export function formatMatchDate(updatedAtMs: number, now = new Date()): string {
  const date = new Date(updatedAtMs || now.getTime());
  if (Number.isNaN(date.getTime())) {
    return now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function asSide(value: unknown, homeName: string, awayName: string, winner: string, homeSets: number, awaySets: number): Side {
  if (value === "home" || value === "away") return value;
  if (winner && winner === homeName) return "home";
  if (winner && winner === awayName) return "away";
  return homeSets >= awaySets ? "home" : "away";
}

function asFormat(value: unknown): MatchFormat {
  return value === "highschool" ? "highschool" : "club";
}

function asScore(value: unknown): number {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 ? Math.floor(next) : 0;
}

export function parseHistoryMatch(value: unknown): HistoryMatch | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const homeName = String(record.homeName || "").trim() || "Team 1";
  const awayName = String(record.awayName || "").trim() || "Team 2";
  const homeSets = asScore(record.homeSets);
  const awaySets = asScore(record.awaySets);
  const winner = String(record.winner || "").trim();
  const winnerSide = asSide(record.winnerSide, homeName, awayName, winner, homeSets, awaySets);
  const completedSets = Array.isArray(record.completedSets)
    ? record.completedSets.map(parseCompletedSet).filter((set): set is CompletedSet => Boolean(set))
    : [];
  const matchFormat = asFormat(record.matchFormat);
  const matchSets = Number(record.matchSets) === 5 || Number(record.matchSets) === 3
    ? Number(record.matchSets)
    : matchFormat === "highschool" ? 5 : 3;
  return {
    id: String(record.id || "").trim() || `match-${Date.now().toString(36)}`,
    title: String(record.title || "").trim() || "Game Night",
    homeName,
    awayName,
    homeSets,
    awaySets,
    winner: winner || (winnerSide === "home" ? homeName : awayName),
    winnerSide,
    homeLogo: typeof record.homeLogo === "string" ? record.homeLogo : "",
    awayLogo: typeof record.awayLogo === "string" ? record.awayLogo : "",
    homeColor: normalizeHex(String(record.homeColor || ""), DEFAULT_HOME_COLOR),
    awayColor: normalizeHex(String(record.awayColor || ""), DEFAULT_AWAY_COLOR),
    completedSets,
    matchFormat,
    matchSets,
    resultBackground: String(record.resultBackground || "default"),
    updatedAtMs: Number(record.updatedAtMs) || Date.now()
  };
}

export function historyMatchFromLive(input: {
  match: MatchState;
  homeLogo?: string;
  awayLogo?: string;
  resultBackground?: string;
  now?: number;
}): HistoryMatch | null {
  const { match } = input;
  if (match.winner !== "home" && match.winner !== "away") return null;
  return {
    id: `match-${(input.now ?? Date.now()).toString(36)}`,
    title: match.matchTitle.trim() || "Game Night",
    homeName: match.homeName.trim() || "Team 1",
    awayName: match.awayName.trim() || "Team 2",
    homeSets: match.homeSets,
    awaySets: match.awaySets,
    winner: match.winner === "home" ? match.homeName : match.awayName,
    winnerSide: match.winner,
    homeLogo: input.homeLogo || "",
    awayLogo: input.awayLogo || "",
    homeColor: normalizeHex(match.homeColor, DEFAULT_HOME_COLOR),
    awayColor: normalizeHex(match.awayColor, DEFAULT_AWAY_COLOR),
    completedSets: [...match.completedSets],
    matchFormat: match.matchFormat,
    matchSets: match.matchSets === 5 || match.matchSets === 3 ? match.matchSets : match.matchFormat === "highschool" ? 5 : 3,
    resultBackground: String(input.resultBackground || "default"),
    updatedAtMs: input.now ?? Date.now()
  };
}

export function loadMatches(storage?: JsonStorage): HistoryMatch[] {
  const raw = readJson<unknown>(MATCH_HISTORY_KEY, [], storage);
  if (!Array.isArray(raw)) return [];
  return raw.map(parseHistoryMatch).filter((item): item is HistoryMatch => Boolean(item));
}

export function saveMatches(matches: HistoryMatch[], storage?: JsonStorage, limit = FREE_MATCH_HISTORY_LIMIT): HistoryMatch[] {
  const next = matches.slice(0, limit);
  writeJson(MATCH_HISTORY_KEY, next, storage);
  return next;
}

export function mergeMatchHistory(local: HistoryMatch[], cloud: HistoryMatch[], limit = FREE_MATCH_HISTORY_LIMIT): HistoryMatch[] {
  const merged = [...cloud];
  local.forEach((match) => {
    if (!merged.some((item) => item.id === match.id)) merged.push(match);
  });
  return merged.slice(0, limit);
}

export function recordCompletedMatch(input: {
  match: MatchState;
  homeLogo?: string;
  awayLogo?: string;
  resultBackground?: string;
  now?: number;
}, storage?: JsonStorage, limit = FREE_MATCH_HISTORY_LIMIT): HistoryMatch | null {
  if (!input.match.winner) return null;
  const key = winnerSaveKey(input.match);
  if (lastSavedWinnerKey === key) return loadMatches(storage)[0] ?? null;
  const recorded = historyMatchFromLive(input);
  if (!recorded) return null;
  lastSavedWinnerKey = key;
  const matches = loadMatches(storage);
  matches.unshift(recorded);
  saveMatches(matches, storage, limit);
  return recorded;
}
