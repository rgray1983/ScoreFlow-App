import { matchBanner, type MatchState } from "../scoring";

export const MAX_LIVE_DATA_LOGO = 180_000;

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function parseLiveLogo(value: unknown): string {
  if (typeof value !== "string") return "";
  const next = value.trim();
  if (isHttpUrl(next) || next.startsWith("data:image/")) return next;
  return "";
}

export function isLiveLogoValue(value: string): boolean {
  const next = value.trim();
  if (isHttpUrl(next)) return true;
  return next.startsWith("data:image/") && next.length <= MAX_LIVE_DATA_LOGO;
}

export function liveLogoValue(value: string): string {
  const next = value.trim();
  return isLiveLogoValue(next) ? next : "";
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
  const fields: { homeLogo?: string; awayLogo?: string } = {};
  const homeLogo = liveLogoValue(logos.homeLogo);
  const awayLogo = liveLogoValue(logos.awayLogo);
  if (homeLogo) fields.homeLogo = homeLogo;
  if (awayLogo) fields.awayLogo = awayLogo;
  return fields;
}
