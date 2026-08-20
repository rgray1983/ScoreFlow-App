import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe
} from "firebase/firestore";
import { ensureAnonymousAuth, getFirebase } from "./firebase";

export const REACTION_EMOJIS = ["❤️", "🔥", "👏", "🎉", "🏐", "💪"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export const CHAT_TEXT_MAX = 60;
export const CHAT_NAME_MAX = 24;
export const CHAT_COOLDOWN_MS = 1800;
export const REACTION_COOLDOWN_MS = 650;
export const CHAT_LISTEN_LIMIT = 40;
export const REACTION_LISTEN_LIMIT = 60;
export const FAN_EVENT_FRESH_MS = 9000;

const SESSION_KEY = "scoreflowViewerSessionId";

export type ChatRole = "viewer" | "scorer";

export type ChatMessage = {
  id: string;
  text: string;
  name: string;
  role: ChatRole;
  sessionId: string;
  uid: string;
  createdAtMs: number;
};

export type ReactionEvent = {
  id: string;
  emoji: ReactionEmoji;
  uid: string;
  createdAtMs: number;
};

export function isReactionEmoji(value: string): value is ReactionEmoji {
  return (REACTION_EMOJIS as readonly string[]).includes(value);
}

export function cleanChatName(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, CHAT_NAME_MAX);
}

export function cleanChatText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, CHAT_TEXT_MAX);
}

export function viewerSessionId(storage: Pick<Storage, "getItem" | "setItem"> | null = defaultSessionStorage()): string {
  try {
    const existing = storage?.getItem(SESSION_KEY)?.trim();
    if (existing) return existing;
    const next = `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    storage?.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return "session-local";
  }
}

export function chatNameStorageKey(gameId: string, sessionId: string): string {
  return `scoreflowViewerChatName:${gameId}:${sessionId}`;
}

export function loadViewerChatName(
  gameId: string,
  sessionId = viewerSessionId(),
  storage: Pick<Storage, "getItem"> | null = defaultSessionStorage()
): string {
  try {
    return cleanChatName(storage?.getItem(chatNameStorageKey(gameId, sessionId)) || "");
  } catch {
    return "";
  }
}

export function saveViewerChatName(
  gameId: string,
  value: string,
  sessionId = viewerSessionId(),
  storage: Pick<Storage, "setItem"> | null = defaultSessionStorage()
): string {
  const name = cleanChatName(value);
  if (!name) return "";
  try {
    storage?.setItem(chatNameStorageKey(gameId, sessionId), name);
  } catch {
    // Private mode can block sessionStorage.
  }
  return name;
}

export function parseChatMessage(id: string, value: unknown): ChatMessage | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const text = cleanChatText(String(record.text || ""));
  if (!text) return null;
  const role = record.role === "scorer" ? "scorer" : "viewer";
  return {
    id,
    text,
    name: cleanChatName(String(record.name || "")) || (role === "scorer" ? "Scorer" : "Fan"),
    role,
    sessionId: String(record.sessionId || ""),
    uid: String(record.uid || ""),
    createdAtMs: Number(record.createdAtMs) || 0
  };
}

export function parseReaction(id: string, value: unknown): ReactionEvent | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const emoji = String(record.emoji || "");
  if (!isReactionEmoji(emoji)) return null;
  return {
    id,
    emoji,
    uid: String(record.uid || ""),
    createdAtMs: Number(record.createdAtMs) || 0
  };
}

export function isFreshFanEvent(createdAtMs: number, now = Date.now()): boolean {
  return createdAtMs > 0 && now - createdAtMs < FAN_EVENT_FRESH_MS;
}

function chatCollection(gameId: string) {
  const { db } = getFirebase();
  return collection(db, "volleyballGames", gameId, "chat");
}

function reactionCollection(gameId: string) {
  const { db } = getFirebase();
  return collection(db, "volleyballGames", gameId, "reactions");
}

export function listenChat(
  gameId: string,
  onMessages: (messages: ChatMessage[]) => void,
  onAdded?: (message: ChatMessage) => void
): Unsubscribe {
  const chatQuery = query(chatCollection(gameId), orderBy("createdAtMs", "asc"), limit(CHAT_LISTEN_LIMIT));
  return onSnapshot(chatQuery, (snap) => {
    onMessages(snap.docs.map((item) => parseChatMessage(item.id, item.data())).filter((item): item is ChatMessage => Boolean(item)));
    if (!onAdded) return;
    snap.docChanges().forEach((change) => {
      if (change.type !== "added") return;
      const message = parseChatMessage(change.doc.id, change.doc.data());
      if (message) onAdded(message);
    });
  }, () => onMessages([]));
}

export function listenReactions(
  gameId: string,
  onReaction: (reaction: ReactionEvent) => void
): Unsubscribe {
  const reactionQuery = query(reactionCollection(gameId), orderBy("createdAtMs", "asc"), limit(REACTION_LISTEN_LIMIT));
  return onSnapshot(reactionQuery, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type !== "added") return;
      const reaction = parseReaction(change.doc.id, change.doc.data());
      if (reaction) onReaction(reaction);
    });
  }, () => {
    // A missing index should not take down the scoreboard.
  });
}

export async function sendChatMessage(input: {
  gameId: string;
  text: string;
  name: string;
  role: ChatRole;
  sessionId: string;
}): Promise<void> {
  const text = cleanChatText(input.text);
  const name = cleanChatName(input.name);
  if (!text || !name) return;
  const user = await ensureAnonymousAuth();
  await addDoc(chatCollection(input.gameId), {
    text,
    name,
    role: input.role,
    sessionId: input.sessionId,
    uid: user.uid,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now()
  });
}

export async function sendReaction(gameId: string, emoji: string): Promise<void> {
  if (!isReactionEmoji(emoji)) return;
  const user = await ensureAnonymousAuth();
  await addDoc(reactionCollection(gameId), {
    emoji,
    uid: user.uid,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now()
  });
}

function defaultSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}
