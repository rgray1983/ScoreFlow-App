import { parseHomeTeam, type HomeTeam } from "./homeTeam";
import { readJson, writeJson, type JsonStorage } from "./local";

export type RosterPlayer = { id: string; name: string; number: string };
export type TeamProfile = HomeTeam & { id: string; roster: RosterPlayer[] };
export type TeamBook = { selectedId: string; teams: TeamProfile[] };
export const TEAMS_KEY = "scoreflowTeamsV1";

export function parseRoster(value: unknown): RosterPlayer[] {
  const ids = new Set<string>();
  return (Array.isArray(value) ? value : []).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const id = typeof item.id === "string" ? item.id.slice(0, 80) : "";
    const name = typeof item.name === "string" ? item.name.trim().slice(0, 32) : "";
    if (!id || !name || ids.has(id)) return [];
    ids.add(id);
    return [{ id, name, number: String(item.number || "").replace(/[^0-9]/g, "").slice(0, 3) }];
  });
}

export function loadTeamBook(home: HomeTeam | null, storage?: JsonStorage): TeamBook {
  const saved = readJson<Partial<TeamBook>>(TEAMS_KEY, {}, storage);
  const ids = new Set<string>();
  const teams: TeamProfile[] = (Array.isArray(saved?.teams) ? saved.teams : []).flatMap((item) => {
    const team = parseHomeTeam(item);
    const id = typeof item?.id === "string" ? item.id.slice(0, 80) : "";
    if (!team || !id || ids.has(id)) return [];
    ids.add(id);
    return [{ ...team, id, roster: parseRoster(item.roster) }];
  });
  if (!teams.length && home) teams.push({ ...home, id: "home-team", roster: [] });
  return { teams, selectedId: teams.some((t) => t.id === saved?.selectedId) ? saved.selectedId! : teams[0]?.id || "" };
}

export function saveTeamBook(book: TeamBook, storage?: JsonStorage) {
  writeJson(TEAMS_KEY, book, storage);
}
