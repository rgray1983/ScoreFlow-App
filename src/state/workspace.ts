import { withSoundEvent } from "../audio/events";
import { loadTeamBook, saveTeamBook, parseRoster, type TeamProfile, type RosterPlayer } from "../storage/teams";
import { loadMatchContext, saveMatchContext } from "../storage/matchContext";
import { matchPlays } from "../scoring/plays";
import { create } from "zustand";
import { reduce, type Command, type MatchEngine } from "../scoring";
import type { HomeTeam } from "../storage/homeTeam";
import { loadHomeTeam, saveHomeTeamRecord } from "../storage/homeTeam";
import { engineFromDraft, loadMatchEngine, saveMatchEngine } from "../storage/matchEngine";
import { recordCompletedMatch, resetHistorySaveGuard } from "../storage/matchHistory";
import { matchHistoryLimit } from "../storage/premium";
import { backupCompletedMatch, syncHomeTeamToCloud } from "../live/backup";
import { usePremium } from "./premium";
import {
  commitMatchDraft,
  loadMatchDraft,
  mergeHomeTeamIntoDraft,
  saveMatchDraft,
  type MatchDraft
} from "../storage/matchSetup";
import { useLiveSession } from "./liveSession";

type WorkspaceState = {
  homeTeam: HomeTeam | null;
  draft: MatchDraft;
  teams: TeamProfile[];
  selectedTeamId: string;
  matchDraft: MatchDraft;
  matchRoster: RosterPlayer[];
  selectTeam: (id: string) => void;
  saveTeamProfile: (team: Omit<TeamProfile, "updatedAtMs">) => void;
  updateMatchDraft: (patch: Partial<MatchDraft>) => void;
  engine: MatchEngine;
  saveHomeTeam: (team: Omit<HomeTeam, "updatedAtMs">) => HomeTeam;
  applyHomeTeamToDraft: () => void;
  updateDraft: (patch: Partial<MatchDraft>) => void;
  startMatch: () => MatchDraft;
  dispatch: (command: Command) => MatchEngine;
};

function bootDraft(): MatchDraft {
  return mergeHomeTeamIntoDraft(loadMatchDraft(), loadHomeTeam());
}

function bootEngine(draft: MatchDraft): MatchEngine {
  return loadMatchEngine() ?? engineFromDraft(draft);
}

export const useWorkspace = create<WorkspaceState>((set, get) => {
  const draft = bootDraft();
  const book = loadTeamBook(loadHomeTeam());
  const context = loadMatchContext(loadMatchDraft());
  // Existing matches predate the separate context key. Freeze that in-memory
  // snapshot before any next-match setup changes, including team selection.
  const preserveMatchContext = () => saveMatchContext({ draft: get().matchDraft, roster: get().matchRoster });
  return {
    homeTeam: loadHomeTeam(),
    draft,
    teams: book.teams,
    selectedTeamId: book.selectedId,
    matchDraft: context.draft,
    matchRoster: context.roster,
    selectTeam(id) {
      if (!usePremium.getState().isPro) return;
      const team = get().teams.find((item) => item.id === id);
      if (!team) return;
      preserveMatchContext();
      saveTeamBook({ teams: get().teams, selectedId: id });
      const homeTeam = saveHomeTeamRecord(team);
      const draft = saveMatchDraft({ ...get().draft, homeName: team.name, homeColor: team.color, homeLogo: team.logo });
      set({ selectedTeamId: id, homeTeam, draft });
      const premium = usePremium.getState();
      if (premium.cloudBackup) void syncHomeTeamToCloud(homeTeam);
    },
    saveTeamProfile(team) {
      if (!usePremium.getState().isPro) throw new Error("Multiple teams and rosters require Pro.");
      if (!team.name.trim()) throw new Error("Enter your team name.");
      const next: TeamProfile = { ...team, name: team.name.trim(), location: team.location.trim(), roster: parseRoster(team.roster), updatedAtMs: Date.now() };
      const teams = [...get().teams.filter((item) => item.id !== next.id), next];
      saveTeamBook({ teams, selectedId: next.id });
      set({ teams });
      get().selectTeam(next.id);
    },
    updateMatchDraft(patch) {
      const matchDraft = { ...get().matchDraft, ...patch };
      saveMatchContext({ draft: matchDraft, roster: get().matchRoster });
      set({ matchDraft });
    },
    engine: bootEngine(draft),
    saveHomeTeam(team) {
      preserveMatchContext();
      const next = saveHomeTeamRecord({ ...team, updatedAtMs: Date.now() });
      const id = get().selectedTeamId || "home-team";
      const previous = get().teams.find((item) => item.id === id);
      const teams = [...get().teams.filter((item) => item.id !== id), { ...next, id, roster: previous?.roster || [] }];
      saveTeamBook({ teams, selectedId: id });
      set((state) => ({
        teams, selectedTeamId: id,
        homeTeam: next,
        draft: {
          ...state.draft,
          homeName: next.name,
          homeColor: next.color,
          homeLogo: next.logo
        }
      }));
      saveMatchDraft(get().draft);
      const premium = usePremium.getState();
      if (premium.isPro && premium.cloudBackup) {
        void syncHomeTeamToCloud(next);
      }
      return next;
    },
    applyHomeTeamToDraft() {
      preserveMatchContext();
      const next = mergeHomeTeamIntoDraft(get().draft, get().homeTeam);
      saveMatchDraft(next);
      set({ draft: next });
    },
    updateDraft(patch) {
      preserveMatchContext();
      const next = saveMatchDraft({ ...get().draft, ...patch });
      set({ draft: next });
    },
    startMatch() {
      void useLiveSession.getState().endLive();
      const committed = saveMatchDraft(commitMatchDraft(get().draft));
      const engine = saveMatchEngine(engineFromDraft(committed, get().engine.match.boardTheme));
      resetHistorySaveGuard();
      const team = get().teams.find((item) => item.id === get().selectedTeamId);
      const matchRoster = usePremium.getState().isPro && team?.name === committed.homeName ? parseRoster(team.roster) : [];
      saveMatchContext({ draft: committed, roster: matchRoster });
      set({ draft: committed, matchDraft: committed, matchRoster, engine });
      useLiveSession.getState().publishBranding(engine.match, committed);
      return committed;
    },
    dispatch(command) {
      if (command.type === "newMatch") void useLiveSession.getState().endLive();
      const previous = get().engine;
      if (command.type === "highlight" && command.call.player) {
        const playerId = command.call.player.id;
        const player = get().matchRoster.find((p) => p.id === playerId);
        if (!usePremium.getState().isPro || command.call.side !== "home" || !player) return previous;
        command = { ...command, call: { ...command.call, player: { ...player } } };
      }
      const next = withSoundEvent(previous, reduce(previous, command), command,
        () => ({ id: crypto.randomUUID(), atMs: Date.now(),
          ...(typeof navigator !== "undefined" && navigator.onLine === false ? { remote: false } : {}) }));
      if (next === previous) return previous;
      const engine = saveMatchEngine(next);
      set({ engine });
      useLiveSession.getState().publishScore(engine.match, matchPlays(engine));
      if (command.type === "newMatch") resetHistorySaveGuard();
      if (engine.match.winner) {
        const premium = usePremium.getState();
        const recorded = recordCompletedMatch({
          match: engine.match,
          homeLogo: get().matchDraft.homeLogo,
          awayLogo: get().matchDraft.awayLogo,
          resultBackground: premium.resultBackground
        }, undefined, matchHistoryLimit(premium));
        if (recorded) {
          void backupCompletedMatch(recorded, {
            isPro: premium.isPro,
            theme: premium.theme,
            posterStyle: premium.posterStyle,
            resultBackground: premium.resultBackground,
            cloudBackup: premium.cloudBackup
          });
        }
      }
      return engine;
    }
  };
});
