import { create } from "zustand";
import type { HomeTeam } from "../storage/homeTeam";
import { loadHomeTeam, saveHomeTeamRecord } from "../storage/homeTeam";
import {
  commitMatchDraft,
  loadMatchDraft,
  mergeHomeTeamIntoDraft,
  saveMatchDraft,
  type MatchDraft
} from "../storage/matchSetup";

type WorkspaceState = {
  homeTeam: HomeTeam | null;
  draft: MatchDraft;
  saveHomeTeam: (team: Omit<HomeTeam, "updatedAtMs">) => HomeTeam;
  applyHomeTeamToDraft: () => void;
  updateDraft: (patch: Partial<MatchDraft>) => void;
  startMatch: () => MatchDraft;
};

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  homeTeam: loadHomeTeam(),
  draft: mergeHomeTeamIntoDraft(loadMatchDraft(), loadHomeTeam()),
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
    set({ draft: committed });
    return committed;
  }
}));
