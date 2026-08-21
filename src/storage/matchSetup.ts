import type { MatchFormat } from "../scoring";
import { DEFAULT_AWAY_COLOR, DEFAULT_HOME_COLOR, normalizeHex } from "../lib/color";
import type { HomeTeam } from "./homeTeam";
import { readJson, writeJson, type JsonStorage } from "./local";

export const MATCH_DRAFT_KEY = "scoreflowMatchDraftV1";

export type MatchDraft = {
  title: string;
  format: MatchFormat;
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
  homeLogo: string;
  awayLogo: string;
};

export const EMPTY_MATCH_DRAFT: MatchDraft = {
  title: "Game Night",
  format: "club",
  homeName: "Team 1",
  awayName: "Team 2",
  homeColor: DEFAULT_HOME_COLOR,
  awayColor: DEFAULT_AWAY_COLOR,
  homeLogo: "",
  awayLogo: ""
};

export function parseMatchDraft(value: unknown): MatchDraft {
  if (!value || typeof value !== "object") return { ...EMPTY_MATCH_DRAFT };
  const record = value as Record<string, unknown>;
  return {
    title: record.title == null ? EMPTY_MATCH_DRAFT.title : String(record.title),
    format: record.format === "highschool" ? "highschool" : "club",
    homeName: record.homeName == null ? EMPTY_MATCH_DRAFT.homeName : String(record.homeName),
    awayName: record.awayName == null ? EMPTY_MATCH_DRAFT.awayName : String(record.awayName),
    homeColor: normalizeHex(String(record.homeColor || ""), DEFAULT_HOME_COLOR),
    awayColor: normalizeHex(String(record.awayColor || ""), DEFAULT_AWAY_COLOR),
    homeLogo: typeof record.homeLogo === "string" ? record.homeLogo : "",
    awayLogo: typeof record.awayLogo === "string" ? record.awayLogo : ""
  };
}

export function commitMatchDraft(draft: MatchDraft): MatchDraft {
  return parseMatchDraft({
    ...draft,
    title: draft.title.trim() || EMPTY_MATCH_DRAFT.title,
    homeName: draft.homeName.trim() || EMPTY_MATCH_DRAFT.homeName,
    awayName: draft.awayName.trim() || EMPTY_MATCH_DRAFT.awayName
  });
}

export function mergeHomeTeamIntoDraft(draft: MatchDraft, homeTeam: HomeTeam | null): MatchDraft {
  if (!homeTeam) return draft;
  const homeName = draft.homeName.trim();
  const usingDefaultHome =
    !homeName ||
    homeName === EMPTY_MATCH_DRAFT.homeName ||
    homeName === homeTeam.name;
  if (!usingDefaultHome) return draft;
  return {
    ...draft,
    homeName: homeTeam.name,
    homeColor: homeTeam.color,
    homeLogo: homeTeam.logo
  };
}

export function loadMatchDraft(storage?: JsonStorage): MatchDraft {
  return parseMatchDraft(readJson(MATCH_DRAFT_KEY, null, storage));
}

export function saveMatchDraft(draft: MatchDraft, storage?: JsonStorage): MatchDraft {
  const next = parseMatchDraft(draft);
  writeJson(MATCH_DRAFT_KEY, next, storage);
  return next;
}

export function matchFormatLabel(format: MatchFormat): string {
  return format === "highschool" ? "High School · Best 3 of 5" : "Club · Best 2 of 3";
}
