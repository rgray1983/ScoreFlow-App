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
  return {
    homeTeam: loadHomeTeam(),
    draft,
    engine: bootEngine(draft),
    saveHomeTeam(team) {
      const next = saveHomeTeamRecord({ ...team, updatedAtMs: Date.now() });
      set((state) => ({
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
      const next = mergeHomeTeamIntoDraft(get().draft, get().homeTeam);
      saveMatchDraft(next);
      set({ draft: next });
    },
    updateDraft(patch) {
      const next = saveMatchDraft({ ...get().draft, ...patch });
      set({ draft: next });
    },
    startMatch() {
      const committed = saveMatchDraft(commitMatchDraft(get().draft));
      const engine = saveMatchEngine(engineFromDraft(committed));
      resetHistorySaveGuard();
      set({ draft: committed, engine });
      useLiveSession.getState().publishBranding(engine.match, committed);
      return committed;
    },
    dispatch(command) {
      const engine = saveMatchEngine(reduce(get().engine, command));
      set({ engine });
      useLiveSession.getState().publishScore(engine.match);
      if (command.type === "newMatch") resetHistorySaveGuard();
      if (engine.match.winner) {
        const premium = usePremium.getState();
        const recorded = recordCompletedMatch({
          match: engine.match,
          homeLogo: get().draft.homeLogo,
          awayLogo: get().draft.awayLogo,
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
