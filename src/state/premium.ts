import { create } from "zustand";
import { loadHomeTeam } from "../storage/homeTeam";
import { loadMatches } from "../storage/matchHistory";
import {
  applyPremiumToDocument,
  loadPremium,
  matchHistoryLimit,
  normalizeResultBackground,
  normalizeTheme,
  resultBackgroundById,
  savePremium,
  themeById,
  toggleProPreview,
  type PremiumSettings,
  type ResultBackgroundId,
  type ThemeId
} from "../storage/premium";
import { syncLocalDataToCloud, syncPremiumToCloud } from "../live/backup";
import { toast } from "./toast";

type PremiumState = PremiumSettings & {
  highlightPro: boolean;
  hydrate: () => void;
  persist: (sync?: boolean) => PremiumSettings;
  togglePro: () => void;
  setTheme: (themeId: ThemeId) => boolean;
  setResultBackground: (backgroundId: ResultBackgroundId) => boolean;
  setCloudBackup: (on: boolean) => boolean;
  requestProFocus: () => void;
  clearProFocus: () => void;
};

function premiumSnapshot(state: Pick<PremiumSettings, keyof PremiumSettings>): PremiumSettings {
  return {
    isPro: state.isPro,
    theme: state.theme,
    posterStyle: state.posterStyle,
    resultBackground: state.resultBackground,
    cloudBackup: state.cloudBackup
  };
}

function persistPremium(premium: PremiumSettings, sync: boolean): PremiumSettings {
  const next = savePremium(premiumSnapshot(premium));
  applyPremiumToDocument(next);
  if (sync) {
    void syncPremiumToCloud(next);
    if (next.cloudBackup && next.isPro) {
      void syncLocalDataToCloud({
        premium: next,
        matches: loadMatches().slice(0, matchHistoryLimit(next)),
        homeTeam: loadHomeTeam()
      });
    }
  }
  return next;
}

export const usePremium = create<PremiumState>((set, get) => {
  const initial = loadPremium();
  applyPremiumToDocument(initial);
  return {
    ...initial,
    highlightPro: false,
    hydrate() {
      const next = loadPremium();
      applyPremiumToDocument(next);
      set({ ...next });
    },
    persist(sync = true) {
      const next = persistPremium(premiumSnapshot(get()), sync);
      set({ ...next });
      return next;
    },
    togglePro() {
      const next = persistPremium(toggleProPreview(premiumSnapshot(get())), true);
      set({ ...next });
      toast(next.isPro ? "ScoreFlow Pro preview unlocked" : "Returned to Free plan");
    },
    setTheme(themeId) {
      const themeOk = normalizeTheme(themeId, get().isPro) === themeId;
      if (!themeOk) {
        toast("That theme is a Pro feature", true);
        get().requestProFocus();
        return false;
      }
      const next = persistPremium({ ...premiumSnapshot(get()), theme: themeId }, true);
      set({ ...next });
      toast(`${themeById(themeId).name} theme applied`);
      return true;
    },
    setResultBackground(backgroundId) {
      const ok = normalizeResultBackground(backgroundId, get().isPro) === backgroundId;
      if (!ok) {
        toast("That background graphic is a Pro feature", true);
        get().requestProFocus();
        return false;
      }
      const next = persistPremium({ ...premiumSnapshot(get()), resultBackground: backgroundId }, true);
      set({ ...next });
      toast(`${resultBackgroundById(backgroundId).name} background selected`);
      return true;
    },
    setCloudBackup(on) {
      if (!get().isPro) {
        toast("Cloud backup is a Pro feature", true);
        get().requestProFocus();
        return false;
      }
      const next = persistPremium({ ...premiumSnapshot(get()), cloudBackup: on }, true);
      set({ ...next });
      toast(next.cloudBackup ? "Cloud backup enabled" : "Cloud backup paused");
      return true;
    },
    requestProFocus() {
      set({ highlightPro: true });
    },
    clearProFocus() {
      set({ highlightPro: false });
    }
  };
});
