import type { MatchEngine, MatchFormat, MatchState, Side } from "./types";

export const FORMAT_RULES: Record<MatchFormat, { matchSets: number; setsToWin: number; winBy: number }> = {
  club: { matchSets: 3, setsToWin: 2, winBy: 2 },
  highschool: { matchSets: 5, setsToWin: 3, winBy: 2 }
};

export const TIMEOUTS_PER_SET = 2;
export const TIMEOUT_MS = 45_000;

export function otherSide(side: Side): Side {
  return side === "home" ? "away" : "home";
}

export function scoreOf(match: MatchState, side: Side): number {
  return side === "home" ? match.homeScore : match.awayScore;
}

export function setsOf(match: MatchState, side: Side): number {
  return side === "home" ? match.homeSets : match.awaySets;
}

export function pointsToWin(match: MatchState): number {
  return match.setNumber >= match.matchSets ? 15 : 25;
}

export function isMatchOver(match: MatchState): boolean {
  return match.winner !== "" || match.homeSets >= match.setsToWin || match.awaySets >= match.setsToWin;
}

export function hasWonSet(match: MatchState, side: Side): boolean {
  const own = scoreOf(match, side);
  const opp = scoreOf(match, otherSide(side));
  return own >= pointsToWin(match) && own - opp >= match.winBy;
}

export function isSetPoint(match: MatchState, side: Side): boolean {
  if (isMatchOver(match)) return false;
  const target = pointsToWin(match);
  const own = scoreOf(match, side);
  const opp = scoreOf(match, otherSide(side));
  const pointNeeded = Math.max(target, opp + match.winBy);
  return own === pointNeeded - 1;
}

export function isMatchPoint(match: MatchState, side: Side): boolean {
  return isSetPoint(match, side) && setsOf(match, side) === match.setsToWin - 1;
}

export function canUndo(engine: MatchEngine): boolean {
  return engine.history.length > 0;
}

export function isServing(match: MatchState, side: Side): boolean {
  return match.servingSide === side;
}

export function timeoutsOf(match: MatchState, side: Side): number {
  return side === "home" ? match.homeTimeouts : match.awayTimeouts;
}

export function timeoutRemainingMs(match: MatchState, nowMs = Date.now()): number {
  if (!match.activeTimeout || match.timeoutEndsAtMs <= 0) return 0;
  return Math.max(0, match.timeoutEndsAtMs - nowMs);
}

export function formatTimeoutClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function matchBanner(match: MatchState): string {
  if (isMatchOver(match) && (match.winner === "home" || match.winner === "away")) {
    const winnerName = match.winner === "home" ? match.homeName : match.awayName;
    return `MATCH WON — ${winnerName}`;
  }
  if (isMatchPoint(match, "home")) return `MATCH POINT — ${match.homeName}`;
  if (isMatchPoint(match, "away")) return `MATCH POINT — ${match.awayName}`;
  if (isSetPoint(match, "home")) return `SET POINT — ${match.homeName}`;
  if (isSetPoint(match, "away")) return `SET POINT — ${match.awayName}`;
  return `FIRST TO ${pointsToWin(match)}`;
}
