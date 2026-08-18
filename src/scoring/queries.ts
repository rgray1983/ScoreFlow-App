import type { MatchEngine, MatchFormat, MatchState, Side } from "./types";

export const FORMAT_RULES: Record<MatchFormat, { matchSets: number; setsToWin: number; winBy: number }> = {
  club: { matchSets: 3, setsToWin: 2, winBy: 2 },
  highschool: { matchSets: 5, setsToWin: 3, winBy: 2 }
};

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
