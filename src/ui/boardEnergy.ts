import { isMatchPoint, isSetPoint, type MatchState, type Side } from "../scoring";

export function pressureState(match?: MatchState | null): { side: Side; kind: "match" | "set" } | null {
  if (!match) return null;
  for (const side of ["home", "away"] as const) {
    if (isMatchPoint(match, side)) return { side, kind: "match" };
  }
  for (const side of ["home", "away"] as const) {
    if (isSetPoint(match, side)) return { side, kind: "set" };
  }
  return null;
}

export function runHeat(match: MatchState | null | undefined, side: Side): number {
  if (!match || match.pendingSet || match.winner || match.runSide !== side) return 0;
  return match.runLength >= 7 ? 3 : match.runLength >= 5 ? 2 : match.runLength >= 3 ? 1 : 0;
}

export function boardEnergyAttributes(match?: MatchState | null) {
  const pressure = pressureState(match);
  return {
    "data-theme": match?.boardTheme || "classic",
    "data-pressure": pressure?.side,
    "data-pressure-kind": pressure?.kind,
    "data-home-heat": runHeat(match, "home"),
    "data-away-heat": runHeat(match, "away")
  };
}
