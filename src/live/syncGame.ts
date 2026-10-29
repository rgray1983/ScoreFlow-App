import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { currentAuthUser, getFirebase } from "./firebase";
import { scoreFields, brandingFields } from "./payload";
import type { PendingGame } from "./outbox";

export async function sendPendingGame(entry: PendingGame) {
  const { db } = getFirebase();
  if (currentAuthUser()?.uid !== entry.ownerId)
    throw new Error("Sign in to the original account to sync this game.");
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, "volleyballGames", entry.gameId);
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    if (
      currentAuthUser()?.uid !== entry.ownerId ||
      (data && data.ownerId !== entry.ownerId)
    ) {
      throw new Error("The live game belongs to another account.");
    }
    // Transactions fence writes surviving a reload or a delayed network request.
    if (
      data &&
      (data.ended || Number(data.syncRevision || 0) >= entry.revision)
    )
      return;
    transaction.set(
      ref,
      {
        ...scoreFields(entry.match),
        playByPlay: entry.plays || [],
        ...brandingFields(entry.branding),
        ownerId: entry.ownerId,
        syncRevision: entry.revision,
        ...(!snapshot.exists()
          ? { createdAt: serverTimestamp(), chatPaused: false }
          : {}),
        ended: entry.ended,
        ...(entry.ended
          ? { endedAt: serverTimestamp(), endedAtMs: Date.now() }
          : {}),
        updatedAt: serverTimestamp(),
        updatedAtMs: Date.now(),
      },
      { merge: true },
    );
  });
}
