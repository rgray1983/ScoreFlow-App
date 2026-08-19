import { create } from "zustand";
import type { MatchState } from "../scoring";
import type { MatchDraft } from "../storage/matchSetup";
import {
  authErrorMessage,
  clearLiveRecovery,
  createGameId,
  createLiveGame,
  endLiveGame,
  firebaseReady,
  isHttpUrl,
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

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = (typeof window === "undefined" ? globalThis : window).setTimeout(() => {
      reject(new Error(message));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function publicLogos(draft: MatchDraft): { homeLogo: string; awayLogo: string } {
  return {
    homeLogo: isHttpUrl(draft.homeLogo) ? draft.homeLogo.trim() : "",
    awayLogo: isHttpUrl(draft.awayLogo) ? draft.awayLogo.trim() : ""
  };
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
      throw new Error("Firebase config is missing.");
    }
    if (get().status === "connecting") return;
    if (get().active && get().gameId && !options?.reuseId) {
      set({ shareOpen: true, status: "live", error: "" });
      return;
    }

    const reuseId = options?.reuseId === true;
    const gameId = reuseId
      ? get().gameId || get().recovery?.gameId || createGameId()
      : createGameId();
    const epoch = get().epoch + 1;
    set({ status: "connecting", error: "", gameId, active: false, epoch });
    stopPresence();
    clearScoreTimer();
    try {
      await withTimeout(
        createLiveGame(gameId, match, publicLogos(draft)),
        12000,
        "Live share timed out. Check your connection and try again."
      );
      if (get().epoch !== epoch) return;
      saveLiveRecovery({
        gameId,
        active: true,
        savedAtMs: Date.now(),
        summary: liveRecoverySummary(match)
      });
      set({
        status: "live",
        active: true,
        gameId,
        error: "",
        shareOpen: true,
        recovery: loadLiveRecovery()
      });
      void (async () => {
        try {
          stopViewerCount = listenViewerCount(gameId, (viewerCount) => {
            if (sessionStillOpen(epoch, gameId, get())) set({ viewerCount });
          });
          await writePresence(gameId, "scorer");
          if (!sessionStillOpen(epoch, gameId, get())) return;
          presenceTimer = window.setInterval(() => {
            if (sessionStillOpen(epoch, gameId, get())) void writePresence(gameId, "scorer");
          }, 15000);
          const logos = await uploadMatchLogos(gameId, { homeLogo: draft.homeLogo, awayLogo: draft.awayLogo });
          if (!sessionStillOpen(epoch, gameId, get())) return;
          if (logos.homeLogo || logos.awayLogo) {
            await updateLiveBranding(gameId, match, logos);
          }
        } catch {
          // The QR is already up. Presence and logos can catch up on the next retry.
        }
      })();
    } catch (error) {
      if (get().epoch !== epoch) return;
      set({
        status: "error",
        active: false,
        gameId: reuseId ? gameId : "",
        error: authErrorMessage(error)
      });
      throw error instanceof Error ? error : new Error(authErrorMessage(error));
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
