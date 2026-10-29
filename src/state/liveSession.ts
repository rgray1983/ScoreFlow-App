import { create } from "zustand";
import type { MatchState } from "../scoring";
import { loadMatchEngine } from "../storage/matchEngine";
import type { MatchDraft } from "../storage/matchSetup";
import { shouldReuseLiveGameId } from "./homeResume";
import {
  clearLiveRecovery,
  createGameId,
  firebaseReady,
  listenViewerCount,
  loadLiveRecovery,
  liveRecoverySummary,
  saveLiveRecovery,
  compactLiveLogos,
  compactScorerBranding,
  viewerUrl,
  writePresence,
  setLiveChatPaused,
  type LiveRecovery,
} from "../live";
import {
  currentAuthUser,
  ensureAnonymousAuth,
  watchAuth,
} from "../live/firebase";
import { LiveOutbox, deviceOutboxStorage } from "../live/outbox";
import { sendPendingGame } from "../live/syncGame";

export type LiveStatus =
  "offline" | "connecting" | "pending" | "live" | "error";
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
  chatPaused: boolean;
  endedThisSession: boolean;
  goLive: (
    match: MatchState,
    draft: MatchDraft,
    options?: { reuseId?: boolean },
  ) => Promise<void>;
  resumeLive: (match: MatchState, draft: MatchDraft) => Promise<void>;
  endLive: () => Promise<void>;
  setChatPaused: (paused: boolean) => Promise<void>;
  publishScore: (match: MatchState) => void;
  publishBranding: (match: MatchState, draft: MatchDraft) => void;
  openShare: () => void;
  closeShare: () => void;
  dismissRecovery: () => void;
  dismissReturnPrompt: () => void;
  offerReturnPrompt: () => void;
};
let latestMatch: MatchState | null = null;
let brandingRevision = 0;
let ownerId = "";
let presenceTimer = 0;
let scoreTimer = 0;
let stopCount: (() => void) | undefined;
const online = () => typeof navigator === "undefined" || navigator.onLine;
const outbox = new LiveOutbox(
  deviceOutboxStorage(),
  sendPendingGame,
  () => currentAuthUser()?.uid || null,
  online,
  () => refreshStatus(),
);
function refreshStatus() {
  const state = useLiveSession.getState();
  if (state.status === "error" && state.error) return;
  const waiting =
    outbox.pending(state.active ? state.gameId : undefined).length > 0;
  useLiveSession.setState({
    status: !online()
      ? "offline"
      : waiting
        ? "pending"
        : state.active
          ? "live"
          : "offline",
    error: outbox.error,
  });
}
function stopPresence() {
  window.clearInterval(presenceTimer);
  stopCount?.();
  stopCount = undefined;
}
function saveRecovery(match: MatchState) {
  const { gameId } = useLiveSession.getState();
  saveLiveRecovery({
    gameId,
    active: true,
    savedAtMs: Date.now(),
    summary: liveRecoverySummary(match),
    ownerId,
  });
  useLiveSession.setState({ recovery: loadLiveRecovery() });
}
function queue(
  match: MatchState,
  ended = false,
  branding?: import("../live/payload").LiveBranding,
) {
  const state = useLiveSession.getState();
  if (!state.active || !state.gameId || !ownerId) return;
  // Never bind a recovered game to a newly signed-in user's identity.
  if (currentAuthUser()?.uid !== ownerId)
    throw new Error("Sign in to the original account to update this game.");
  const pending = outbox.pending(state.gameId)[0];
  if (pending && pending.ownerId !== ownerId)
    throw new Error("Sign in to the original account to resume this game.");
  outbox.enqueue({
    gameId: state.gameId,
    ownerId,
    match,
    ended,
    branding: branding || pending?.branding || { homeLogo: "", awayLogo: "" },
  });
}
function enqueueScore(match: MatchState) {
  try {
    queue(match);
    saveRecovery(match);
    useLiveSession.setState({
      error: "",
      status: online() ? "pending" : "offline",
    });
  } catch (error) {
    useLiveSession.setState({ status: "error", error: String(error) });
  }
}
let booted = false;
export function startLiveSync() {
  if (booted || typeof window === "undefined" || !firebaseReady()) return;
  booted = true;
  const retry = () => {
    refreshStatus();
    void outbox.flush();
  };
  window.addEventListener("online", retry);
  window.addEventListener("offline", refreshStatus);
  window.addEventListener("focus", retry);
  window.setInterval(retry, 5000);
  watchAuth(retry);
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
  chatPaused: false,
  endedThisSession: false,
  openShare: () => set({ shareOpen: true }),
  closeShare: () => set({ shareOpen: false }),
  dismissRecovery: () => set({ recovery: null, returnPrompt: false }),
  dismissReturnPrompt: () => set({ returnPrompt: false }),
  offerReturnPrompt() {
    if (get().active || get().recovery) set({ returnPrompt: true });
  },
  async goLive(match, draft, options) {
    startLiveSync();
    if (get().status === "connecting") {
      set({ shareOpen: true });
      return;
    }
    if (get().active && !options?.reuseId) {
      set({ shareOpen: true });
      void outbox.flush();
      return;
    }
    const reuse = shouldReuseLiveGameId({
      reuseRequested: options?.reuseId,
      endedThisSession: get().endedThisSession,
      gameId: get().gameId,
      recoveryId: get().recovery?.gameId || "",
    });
    const gameId = reuse
      ? get().gameId || get().recovery?.gameId || createGameId()
      : createGameId();
    const epoch = get().epoch + 1;
    latestMatch = match;
    set({ gameId, epoch, status: "connecting", shareOpen: true, error: "" });
    stopPresence();
    window.clearTimeout(scoreTimer);
    try {
      const user = await ensureAnonymousAuth();
      const saved = outbox.pending(gameId)[0];
      if (
        (get().recovery?.ownerId && get().recovery?.ownerId !== user.uid) ||
        (saved && (saved.ownerId !== user.uid || saved.ended))
      )
        throw new Error("This saved link cannot be resumed by this account.");
      const [logos, scorer] = await Promise.all([
        compactLiveLogos(draft),
        compactScorerBranding(),
      ]);
      if (get().epoch !== epoch) return;
      ownerId = user.uid;
      set({ active: true, endedThisSession: false, chatPaused: false });
      const current = latestMatch || match;
      queue(current, false, { ...logos, ...scorer });
      saveRecovery(current);
      void outbox.flush();
      const beat = () => {
        if (get().active && get().epoch === epoch && online())
          void writePresence(gameId, "scorer").catch(() => {});
      };
      beat();
      presenceTimer = window.setInterval(beat, 15000);
      stopCount = listenViewerCount(gameId, (viewerCount) => {
        if (get().epoch === epoch) set({ viewerCount });
      });
      refreshStatus();
    } catch (error) {
      if (get().epoch === epoch)
        set({
          status: "error",
          active: false,
          shareOpen: false,
          error: error instanceof Error ? error.message : String(error),
        });
    }
  },
  async resumeLive(match, draft) {
    const gameId = get().recovery?.gameId || get().gameId;
    if (gameId) {
      set({ gameId });
      await get().goLive(match, draft, { reuseId: true });
    }
  },
  async endLive() {
    window.clearTimeout(scoreTimer);
    const gameId = get().gameId || get().recovery?.gameId;
    try {
      if (gameId && !get().active) {
        const saved = outbox.pending(gameId)[0];
        if (saved && saved.ownerId !== currentAuthUser()?.uid)
          throw new Error("Sign in to the original account to end this game.");
        if (saved && !saved.ended) outbox.enqueue({ ...saved, ended: true });
        if (!saved && get().recovery?.gameId === gameId) {
          const recovery = get().recovery;
          const recoveredMatch = loadMatchEngine()?.match;
          if (
            !recovery?.ownerId ||
            recovery.ownerId !== currentAuthUser()?.uid ||
            !recoveredMatch
          ) {
            throw new Error(
              "Resume this saved match before ending its live link.",
            );
          }
          outbox.enqueue({
            gameId,
            ownerId: recovery.ownerId,
            match: recoveredMatch,
            ended: true,
            branding: { homeLogo: "", awayLogo: "" },
          });
        }
      } else if (latestMatch && get().active) queue(latestMatch, true);
    } catch (error) {
      set({ status: "error", error: String(error) });
      return;
    }
    stopPresence();
    clearLiveRecovery();
    set({
      active: false,
      epoch: get().epoch + 1,
      gameId: "",
      viewerCount: 0,
      shareOpen: false,
      recovery: null,
      returnPrompt: false,
      chatPaused: false,
      endedThisSession: true,
    });
    refreshStatus();
    void outbox.flush();
  },
  async setChatPaused(paused) {
    if (!get().active || !online()) return;
    try {
      await setLiveChatPaused(get().gameId, paused);
      set({ chatPaused: paused });
    } catch {
      /* Score queue remains independent. */
    }
  },
  publishScore(match) {
    latestMatch = match;
    if (!get().active) return;
    enqueueScore(match);
    window.clearTimeout(scoreTimer);
    scoreTimer = window.setTimeout(() => void outbox.flush(), 120);
  },
  publishBranding(match, draft) {
    if (!get().active) return;
    const epoch = get().epoch;
    const revision = ++brandingRevision;
    void compactLiveLogos(draft)
      .then((branding) => {
        if (
          get().active &&
          get().epoch === epoch &&
          revision === brandingRevision
        ) {
          // Read latest score at completion, not the snapshot before image compaction.
          queue(latestMatch || match, false, branding);
          void outbox.flush();
        }
      })
      .catch((error) => set({ status: "error", error: String(error) }));
  },
}));
export function liveViewerUrl(gameId = useLiveSession.getState().gameId) {
  return gameId ? viewerUrl(gameId) : "";
}
