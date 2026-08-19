import { matchBanner, type MatchState } from "../scoring";

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function scoreFields(match: MatchState) {
  return {
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    homeSets: match.homeSets,
    awaySets: match.awaySets,
    setNumber: match.setNumber,
    winBy: match.winBy,
    setsToWin: match.setsToWin,
    matchFormat: match.matchFormat,
    matchSets: match.matchSets,
    matchTitle: match.matchTitle,
    homeName: match.homeName,
    awayName: match.awayName,
    homeColor: match.homeColor,
    awayColor: match.awayColor,
    winner: match.winner,
    completedSets: match.completedSets.map((set) => ({ ...set })),
    lastAlert: matchBanner(match),
    ended: false
  };
}

export function brandingFields(logos: { homeLogo: string; awayLogo: string }) {
  return {
    homeLogo: isHttpUrl(logos.homeLogo) ? logos.homeLogo.trim() : "",
    awayLogo: isHttpUrl(logos.awayLogo) ? logos.awayLogo.trim() : ""
  };
}
