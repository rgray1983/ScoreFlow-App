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

export type LiveStatus = "offline" | "connecting" | "live" | "error";

type GoLiveOptions = {
  reuseId?: boolean;
};

type LiveSessionState = {
  status: LiveStatus;
  active: boolean;
  epoch: number;
  gameId: string;
  viewerCount: number;
  error: string;
  shareOpen: boolean;
  recovery: LiveRecovery | null;
  returnPrompt: boolean;
  goLive: (match: MatchState, draft: MatchDraft, options?: GoLiveOptions) => Promise<void>;
  resumeLive: (match: MatchState, draft: MatchDraft) => Promise<void>;
  endLive: () => Promise<void>;
  publishScore: (match: MatchState) => void;
  publishBranding: (match: MatchState, draft: MatchDraft) => void;
  openShare: () => void;
  closeShare: () => void;
  dismissRecovery: () => void;
  dismissReturnPrompt: () => void;
  offerReturnPrompt: () => void;
};

let scoreTimer = 0;
let presenceTimer = 0;
let stopViewerCount: (() => void) | null = null;

function stopPresence(): void {
  if (typeof window !== "undefined") {
    window.clearInterval(presenceTimer);
  }
  stopViewerCount?.();
  stopViewerCount = null;
}

function clearScoreTimer(): void {
  if (typeof window !== "undefined") {
    window.clearTimeout(scoreTimer);
  }
  scoreTimer = 0;
}

function sessionStillOpen(
  epoch: number,
  gameId: string,
  state: { active: boolean; epoch: number; gameId: string }
): boolean {
  return state.active && state.epoch === epoch && state.gameId === gameId;
}

export const useLiveSession = create<LiveSessionState>((set, get) => ({
  status: "offline",
  active: false,
  epoch: 0,
  gameId: "",
  viewerCount: 0,
  error: "",
  shareOpen: false,
  recovery: loadLiveRecovery(),
  returnPrompt: Boolean(loadLiveRecovery()),
  openShare() {
    set({ shareOpen: true });
  },
  closeShare() {
    set({ shareOpen: false });
  },
  dismissRecovery() {
    set({ recovery: null, returnPrompt: false });
  },
  dismissReturnPrompt() {
    set({ returnPrompt: false });
  },
  offerReturnPrompt() {
    if (get().active || get().recovery) set({ returnPrompt: true });
  },
  async goLive(match, draft, options) {
    if (!firebaseReady()) {
      set({ status: "error", error: "Firebase config is missing.", active: false });
      return;
    }
    if (get().active && get().gameId && !options?.reuseId) {
      set({ shareOpen: true, status: "live", error: "" });
      return;
    }

    const reuseId = options?.reuseId === true;
    const gameId = reuseId
      ? get().gameId || get().recovery?.gameId || createGameId()
      : createGameId();
    const epoch = get().epoch + 1;
    set({ status: "offline", error: "", gameId, active: false, epoch });
    stopPresence();
    clearScoreTimer();
    try {
      const logos = await uploadMatchLogos(gameId, { homeLogo: draft.homeLogo, awayLogo: draft.awayLogo });
      if (get().epoch !== epoch) return;
      await createLiveGame(gameId, match, logos);
      if (get().epoch !== epoch) return;
      saveLiveRecovery({
        gameId,
        active: true,
        savedAtMs: Date.now(),
        summary: liveRecoverySummary(match)
      });
      await writePresence(gameId, "scorer");
      if (get().epoch !== epoch) return;
      presenceTimer = window.setInterval(() => {
        if (sessionStillOpen(epoch, gameId, get())) void writePresence(gameId, "scorer");
      }, 15000);
      stopViewerCount = listenViewerCount(gameId, (viewerCount) => {
        if (sessionStillOpen(epoch, gameId, get())) set({ viewerCount });
      });
      set({
        status: "live",
        active: true,
        gameId,
        error: "",
        shareOpen: true,
        recovery: loadLiveRecovery()
      });
    } catch (error) {
      if (get().epoch !== epoch) return;
      set({
        status: "error",
        active: false,
        gameId: reuseId ? gameId : "",
        error: error instanceof Error ? error.message : "Live game could not be created."
      });
    }
  },
  async resumeLive(match, draft) {
    const gameId = get().recovery?.gameId || get().gameId;
    if (!gameId) return;
    set({ gameId });
    await get().goLive(match, draft, { reuseId: true });
  },
  async endLive() {
    const gameId = get().gameId || get().recovery?.gameId;
    const epoch = get().epoch + 1;
    clearScoreTimer();
    stopPresence();
    clearLiveRecovery();
    set({
      status: "offline",
      active: false,
      epoch,
      gameId: "",
      viewerCount: 0,
      error: "",
      shareOpen: false,
      recovery: null,
      returnPrompt: false
    });
    if (gameId) {
      try {
        await endLiveGame(gameId);
      } catch {
        // Local end still clears recovery so the scorer can leave the gym.
      }
    }
  },
  publishScore(match) {
    const { gameId, active, epoch } = get();
    if (!gameId || !active) return;
    clearScoreTimer();
    const startedEpoch = epoch;
    const startedId = gameId;
    scoreTimer = window.setTimeout(() => {
      if (!sessionStillOpen(startedEpoch, startedId, get())) return;
      void updateLiveScore(startedId, match)
        .then(() => {
          if (!sessionStillOpen(startedEpoch, startedId, get())) return;
          saveLiveRecovery({
            gameId: startedId,
            active: true,
            savedAtMs: Date.now(),
            summary: liveRecoverySummary(match)
          });
          set({ status: "live", error: "", recovery: loadLiveRecovery() });
        })
        .catch((error: unknown) => {
          if (!sessionStillOpen(startedEpoch, startedId, get())) return;
          set({
            status: "error",
            error: error instanceof Error ? error.message : "Live update failed."
          });
        });
    }, 120);
  },
  publishBranding(match, draft) {
    const { gameId, active, epoch } = get();
    if (!gameId || !active) return;
    const startedEpoch = epoch;
    const startedId = gameId;
    void (async () => {
      try {
        const logos = await uploadMatchLogos(startedId, { homeLogo: draft.homeLogo, awayLogo: draft.awayLogo });
        if (!sessionStillOpen(startedEpoch, startedId, get())) return;
        await updateLiveBranding(startedId, match, logos);
        if (!sessionStillOpen(startedEpoch, startedId, get())) return;
        set({ status: "live", error: "" });
      } catch (error) {
        if (!sessionStillOpen(startedEpoch, startedId, get())) return;
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
