import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe
} from "firebase/firestore";
import { ensureAnonymousAuth, getFirebase } from "./firebase";

const PRESENCE_TTL_MS = 45_000;

export async function writePresence(gameId: string, role: "scorer" | "viewer"): Promise<void> {
  const user = await ensureAnonymousAuth();
  const { db } = getFirebase();
  await setDoc(doc(db, "volleyballGames", gameId, "presence", user.uid), {
    role,
    uid: user.uid,
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  });
}

export function listenViewerCount(gameId: string, onCount: (count: number) => void): Unsubscribe {
  const { db } = getFirebase();
  const presenceQuery = query(
    collection(db, "volleyballGames", gameId, "presence"),
    orderBy("updatedAtMs", "desc"),
    limit(100)
  );
  return onSnapshot(presenceQuery, (snap) => {
    const cutoff = Date.now() - PRESENCE_TTL_MS;
    const count = snap.docs
      .map((item) => item.data())
      .filter((item) => item.role === "viewer" && Number(item.updatedAtMs || 0) >= cutoff)
      .length;
    onCount(count);
  }, () => onCount(0));
}
