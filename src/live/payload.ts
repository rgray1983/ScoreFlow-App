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
    servingSide: match.servingSide || "",
    lastAlert: matchBanner(match),
    ended: false
  };
}

export type LiveBranding = {
  homeLogo: string;
  awayLogo: string;
  scorerName?: string;
  scorerAvatar?: string;
};

export function brandingFields(branding: LiveBranding) {
  const next: {
    homeLogo?: string;
    awayLogo?: string;
    scorerName?: string;
    scorerAvatar?: string;
  } = {};
  const homeLogo = liveLogoValue(branding.homeLogo);
  const awayLogo = liveLogoValue(branding.awayLogo);
  const scorerName = branding.scorerName?.trim().slice(0, 32) || "";
  const scorerAvatar = liveLogoValue(branding.scorerAvatar || "");
  if (homeLogo) next.homeLogo = homeLogo;
  if (awayLogo) next.awayLogo = awayLogo;
  if (scorerName) next.scorerName = scorerName;
  if (scorerAvatar) next.scorerAvatar = scorerAvatar;
  return next;
}
