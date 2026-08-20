export const RESUME_LIVE_KEY = "scoreflowResumeLive";

export function shouldShowResumeMatch(input: {
  liveActive: boolean;
  hasRecovery: boolean;
  matchHasProgress: boolean;
}): boolean {
  return input.liveActive || input.hasRecovery || input.matchHasProgress;
}

export function shouldPromptLiveReturn(input: {
  liveActive: boolean;
  hasRecovery: boolean;
  returnedToApp: boolean;
}): boolean {
  return input.returnedToApp && (input.liveActive || input.hasRecovery);
}

export function markResumeIntent(storage: Pick<Storage, "setItem"> | null = defaultSessionStorage()): void {
  try {
    storage?.setItem(RESUME_LIVE_KEY, "1");
  } catch {
    // Private mode can block sessionStorage.
  }
}

export function consumeResumeIntent(storage: Pick<Storage, "getItem" | "removeItem"> | null = defaultSessionStorage()): boolean {
  try {
    if (!storage) return false;
    const flagged = storage.getItem(RESUME_LIVE_KEY) === "1";
    if (flagged) storage.removeItem(RESUME_LIVE_KEY);
    return flagged;
  } catch {
    return false;
  }
}

export function isDocumentReload(): boolean {
  if (typeof performance === "undefined") return false;
  const nav = performance.getEntriesByType?.("navigation")?.[0] as PerformanceNavigationTiming | undefined;
  if (nav?.type === "reload") return true;
  return (performance as Performance & { navigation?: { type: number } }).navigation?.type === 1;
}

export function shouldResumeLiveOnMatchPage(input: {
  hasRecovery: boolean;
  liveActive: boolean;
  resumeIntent: boolean;
  documentReload: boolean;
}): boolean {
  return input.hasRecovery && !input.liveActive && (input.resumeIntent || input.documentReload);
}

export function shouldReuseLiveGameId(input: {
  reuseRequested?: boolean;
  endedThisSession: boolean;
  gameId: string;
  recoveryId: string;
}): boolean {
  if (input.reuseRequested === true) return true;
  if (input.endedThisSession) return false;
  return Boolean(input.gameId || input.recoveryId);
}

function defaultSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}
