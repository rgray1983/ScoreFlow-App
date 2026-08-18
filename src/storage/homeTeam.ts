import { DEFAULT_HOME_COLOR, normalizeHex } from "../lib/color";
import { readJson, writeJson, type JsonStorage } from "./local";

export const HOME_TEAM_KEY = "scoreflowHomeTeamV2";

export type HomeTeam = {
  name: string;
  location: string;
  color: string;
  logo: string;
  updatedAtMs: number;
};

export function parseHomeTeam(value: unknown): HomeTeam | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name = String(record.name || "").trim();
  if (!name) return null;
  return {
    name,
    location: String(record.location || "").trim(),
    color: normalizeHex(String(record.color || ""), DEFAULT_HOME_COLOR),
    logo: typeof record.logo === "string" ? record.logo : "",
    updatedAtMs: Number(record.updatedAtMs) || Date.now()
  };
}

export function loadHomeTeam(storage?: JsonStorage): HomeTeam | null {
  return parseHomeTeam(readJson(HOME_TEAM_KEY, null, storage));
}

export function saveHomeTeamRecord(team: HomeTeam, storage?: JsonStorage): HomeTeam {
  const next = parseHomeTeam({ ...team, name: team.name.trim(), location: team.location.trim(), updatedAtMs: Date.now() });
  if (!next) {
    throw new Error("Enter your team name.");
  }
  writeJson(HOME_TEAM_KEY, next, storage);
  return next;
}
