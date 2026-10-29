import { readJson, writeJson } from "./local";
import { parseMatchDraft, type MatchDraft } from "./matchSetup";
import { parseRoster, type RosterPlayer } from "./teams";

const KEY = "scoreflowMatchContextV1";
export type MatchContext = { draft: MatchDraft; roster: RosterPlayer[] };
export function loadMatchContext(fallback: MatchDraft): MatchContext {
  const value = readJson<Partial<MatchContext> | null>(KEY, null);
  return { draft: value?.draft ? parseMatchDraft(value.draft) : fallback, roster: parseRoster(value?.roster) };
}
export function saveMatchContext(value: MatchContext) { writeJson(KEY, value); }
