import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe
} from "firebase/firestore";
import type { MatchState } from "../scoring";
import { parseMatchState } from "../storage/matchEngine";
import { ensureAnonymousAuth, getFirebase } from "./firebase";
import { brandingFields, scoreFields } from "./payload";

export type LiveGameView = {
  match: MatchState;
  homeLogo: string;
  awayLogo: string;
  ended: boolean;
  chatPaused: boolean;
  ownerId: string;
};

function gameRef(gameId: string) {
  const { db } = getFirebase();
  return doc(db, "volleyballGames", gameId);
}

export function parseLiveGame(value: unknown): LiveGameView | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const match = parseMatchState(record);
  if (!match) return null;
  return {
    match,
    homeLogo: typeof record.homeLogo === "string" && !record.homeLogo.startsWith("data:") ? record.homeLogo : "",
    awayLogo: typeof record.awayLogo === "string" && !record.awayLogo.startsWith("data:") ? record.awayLogo : "",
    ended: Boolean(record.ended),
    chatPaused: Boolean(record.chatPaused),
    ownerId: String(record.ownerId || "")
  };
}

export async function createLiveGame(
  gameId: string,
  match: MatchState,
  logos: { homeLogo: string; awayLogo: string }
): Promise<void> {
  const user = await ensureAnonymousAuth();
  await setDoc(gameRef(gameId), {
    ...scoreFields(match),
    ...brandingFields(logos),
    ownerId: user.uid,
    chatPaused: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  });
}

export async function updateLiveScore(gameId: string, match: MatchState): Promise<void> {
  const user = await ensureAnonymousAuth();
  await setDoc(gameRef(gameId), {
    ...scoreFields(match),
    ownerId: user.uid,
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  }, { merge: true });
}

export async function updateLiveBranding(
  gameId: string,
  match: MatchState,
  logos: { homeLogo: string; awayLogo: string }
): Promise<void> {
  const user = await ensureAnonymousAuth();
  await setDoc(gameRef(gameId), {
    ...scoreFields(match),
    ...brandingFields(logos),
    ownerId: user.uid,
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  }, { merge: true });
}

export async function endLiveGame(gameId: string): Promise<void> {
  const user = await ensureAnonymousAuth();
  await setDoc(gameRef(gameId), {
    ownerId: user.uid,
    ended: true,
    endedAt: serverTimestamp(),
    endedAtMs: Date.now(),
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  }, { merge: true });
}

export async function setLiveChatPaused(gameId: string, paused: boolean): Promise<void> {
  const user = await ensureAnonymousAuth();
  await setDoc(gameRef(gameId), {
    ownerId: user.uid,
    chatPaused: paused,
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  }, { merge: true });
}

export async function readLiveGame(gameId: string): Promise<LiveGameView | null> {
  await ensureAnonymousAuth();
  const snap = await getDoc(gameRef(gameId));
  if (!snap.exists()) return null;
  return parseLiveGame(snap.data());
}

export function listenLiveGame(gameId: string, onGame: (game: LiveGameView | null) => void): Unsubscribe {
  return onSnapshot(gameRef(gameId), (snap) => {
    onGame(snap.exists() ? parseLiveGame(snap.data()) : null);
  }, () => onGame(null));
}
