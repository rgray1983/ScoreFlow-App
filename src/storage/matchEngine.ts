import {
  createMatch,
  TIMEOUTS_PER_SET,
  type CompletedSet,
  type MatchEngine,
  type MatchFormat,
  type MatchState,
  type Side
} from "../scoring";
import type { MatchDraft } from "./matchSetup";
import { readJson, writeJson, type JsonStorage } from "./local";

export const MATCH_ENGINE_KEY = "scoreflowMatchEngineV1";

export function engineFromDraft(draft: MatchDraft): MatchEngine {
  return createMatch({
    matchFormat: draft.format,
    matchTitle: draft.title,
    homeName: draft.homeName,
    awayName: draft.awayName,
    homeColor: draft.homeColor,
    awayColor: draft.awayColor
  });
}

export function matchHasProgress(engine: MatchEngine): boolean {
  const match = engine.match;
  return (
    engine.history.length > 0 ||
    match.homeScore > 0 ||
    match.awayScore > 0 ||
    match.homeSets > 0 ||
    match.awaySets > 0 ||
    match.winner !== ""
  );
}

function asSide(value: unknown): Side | "" {
  return value === "home" || value === "away" ? value : "";
}

function asFormat(value: unknown): MatchFormat {
  return value === "highschool" ? "highschool" : "club";
}

function asScore(value: unknown): number {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 ? Math.floor(next) : 0;
}

function asTimeouts(value: unknown): number {
  if (value === undefined || value === null || value === "") return TIMEOUTS_PER_SET;
  const next = Number(value);
  if (!Number.isFinite(next)) return TIMEOUTS_PER_SET;
  return Math.max(0, Math.min(TIMEOUTS_PER_SET, Math.floor(next)));
}

export function parseCompletedSet(value: unknown): CompletedSet | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const winner = asSide(record.winner);
  if (winner !== "home" && winner !== "away") return null;
  return {
    set: Math.max(1, asScore(record.set)),
    homeScore: asScore(record.homeScore),
    awayScore: asScore(record.awayScore),
    winner
  };
}

export function parseMatchState(value: unknown): MatchState | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const completedSets = Array.isArray(record.completedSets)
    ? record.completedSets.map(parseCompletedSet).filter((set): set is CompletedSet => Boolean(set))
    : [];
  return createMatch({
    homeScore: asScore(record.homeScore),
    awayScore: asScore(record.awayScore),
    homeSets: asScore(record.homeSets),
    awaySets: asScore(record.awaySets),
    setNumber: Math.max(1, asScore(record.setNumber) || 1),
    matchTitle: String(record.matchTitle || ""),
    homeName: String(record.homeName || ""),
    awayName: String(record.awayName || ""),
    homeColor: String(record.homeColor || ""),
    awayColor: String(record.awayColor || ""),
    winner: asSide(record.winner),
    servingSide: asSide(record.servingSide),
    homeTimeouts: asTimeouts(record.homeTimeouts),
    awayTimeouts: asTimeouts(record.awayTimeouts),
    activeTimeout: asSide(record.activeTimeout),
    timeoutEndsAtMs: asScore(record.timeoutEndsAtMs),
    completedSets,
    matchFormat: asFormat(record.matchFormat)
  }).match;
}

export function parseMatchEngine(value: unknown): MatchEngine | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const match = parseMatchState(record.match);
  if (!match) return null;
  const history = Array.isArray(record.history)
    ? record.history.map(parseMatchState).filter((item): item is MatchState => Boolean(item))
    : [];
  return { match, history };
}

export function loadMatchEngine(storage?: JsonStorage): MatchEngine | null {
  return parseMatchEngine(readJson(MATCH_ENGINE_KEY, null, storage));
}

export function saveMatchEngine(engine: MatchEngine, storage?: JsonStorage): MatchEngine {
  writeJson(MATCH_ENGINE_KEY, engine, storage);
  return engine;
}
