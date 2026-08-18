import { create } from "zustand";
import type { MatchState } from "../scoring";
import type { MatchDraft } from "../storage/matchSetup";
import {
  clearLiveRecovery,
  createGameId,
  createLiveGame,
  endLiveGame,
  firebaseReady,
  listenViewerCount,
  loadLiveRecovery,
  liveRecoverySummary,
  saveLiveRecovery,
  updateLiveBranding,
  updateLiveScore,
  uploadMatchLogos,
  viewerUrl,
  writePresence,
  type LiveRecovery
} from "../live";

export type LiveStatus = "offline" | "live" | "error";

type LiveSessionState = {
  status: LiveStatus;
  gameId: string;
  viewerCount: number;
  error: string;
  shareOpen: boolean;
  recovery: LiveRecovery | null;
  goLive: (match: MatchState, draft: MatchDraft) => Promise<void>;
  resumeLive: (match: MatchState, draft: MatchDraft) => Promise<void>;
  endLive: () => Promise<void>;
  publishScore: (match: MatchState) => void;
  publishBranding: (match: MatchState, draft: MatchDraft) => void;
  openShare: () => void;
  closeShare: () => void;
  dismissRecovery: () => void;
};

let scoreTimer = 0;
let presenceTimer = 0;
let stopViewerCount: (() => void) | null = null;

function stopPresence(): void {
  window.clearInterval(presenceTimer);
  stopViewerCount?.();
  stopViewerCount = null;
}

export const useLiveSession = create<LiveSessionState>((set, get) => ({
  status: "offline",
  gameId: "",
  viewerCount: 0,
  error: "",
  shareOpen: false,
  recovery: loadLiveRecovery(),
  openShare() {
    set({ shareOpen: true });
  },
  closeShare() {
    set({ shareOpen: false });
  },
  dismissRecovery() {
    set({ recovery: null });
  },
  async goLive(match, draft) {
    if (!firebaseReady()) {
      set({ status: "error", error: "Firebase config is missing." });
      return;
    }
    const existingId = get().gameId || get().recovery?.gameId || "";
    const gameId = existingId || createGameId();
    set({ status: "offline", error: "", gameId });
    stopPresence();
    try {
      const logos = await uploadMatchLogos(gameId, { homeLogo: draft.homeLogo, awayLogo: draft.awayLogo });
      await createLiveGame(gameId, match, logos);
      saveLiveRecovery({
        gameId,
        active: true,
        savedAtMs: Date.now(),
        summary: liveRecoverySummary(match)
      });
      await writePresence(gameId, "scorer");
      presenceTimer = window.setInterval(() => {
        void writePresence(gameId, "scorer");
      }, 15000);
      stopViewerCount = listenViewerCount(gameId, (viewerCount) => set({ viewerCount }));
      set({ status: "live", gameId, error: "", shareOpen: true, recovery: loadLiveRecovery() });
    } catch (error) {
      set({
        status: "error",
        error: error instanceof Error ? error.message : "Live game could not be created."
      });
    }
  },
  async resumeLive(match, draft) {
    const gameId = get().recovery?.gameId || get().gameId;
    if (!gameId) return;
    set({ gameId });
    await get().goLive(match, draft);
  },
  async endLive() {
    const gameId = get().gameId || get().recovery?.gameId;
    stopPresence();
    if (gameId) {
      try {
        await endLiveGame(gameId);
      } catch {
        // Local end still clears recovery so the scorer can leave the gym.
      }
    }
    clearLiveRecovery();
    set({ status: "offline", gameId: "", viewerCount: 0, error: "", shareOpen: false, recovery: null });
  },
  publishScore(match) {
    const { gameId, status } = get();
    if (!gameId || status === "offline") return;
    window.clearTimeout(scoreTimer);
    scoreTimer = window.setTimeout(() => {
      void updateLiveScore(gameId, match)
        .then(() => {
          saveLiveRecovery({
            gameId,
            active: true,
            savedAtMs: Date.now(),
            summary: liveRecoverySummary(match)
          });
          set({ status: "live", error: "" });
        })
        .catch((error: unknown) => {
          set({
            status: "error",
            error: error instanceof Error ? error.message : "Live update failed."
          });
        });
    }, 120);
  },
  publishBranding(match, draft) {
    const { gameId, status } = get();
    if (!gameId || status === "offline") return;
    void (async () => {
      try {
        const logos = await uploadMatchLogos(gameId, { homeLogo: draft.homeLogo, awayLogo: draft.awayLogo });
        await updateLiveBranding(gameId, match, logos);
        set({ status: "live", error: "" });
      } catch (error) {
        set({
          status: "error",
          error: error instanceof Error ? error.message : "Live branding update failed."
        });
      }
    })();
  }
}));

export function liveViewerUrl(gameId = useLiveSession.getState().gameId): string {
  return gameId ? viewerUrl(gameId) : "";
}
