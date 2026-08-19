import { firebaseConfig } from "./config";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, type Auth, type User } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let warming: Promise<User | null> | null = null;

export function firebaseReady(): boolean {
  return Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId);
}

function firestoreFor(appInstance: FirebaseApp): Firestore {
  try {
    return initializeFirestore(appInstance, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true
    });
  } catch {
    return getFirestore(appInstance);
  }
}

export function getFirebase() {
  if (!firebaseReady()) {
    throw new Error("Firebase config is missing.");
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = firestoreFor(app);
    storage = getStorage(app);
  }
  return { app, auth: auth!, db: db!, storage: storage! };
}

export function liveErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const host = typeof location === "undefined" ? "this host" : location.hostname;
  if (code === "auth/unauthorized-domain") {
    return `Add ${host} to Firebase Authentication → Settings → Authorized domains`;
  }
  if (code === "auth/operation-not-allowed") {
    return "Enable Anonymous Authentication in the Firebase console";
  }
  if (code === "auth/network-request-failed") {
    return "Live session blocked. Check your connection and ad blockers.";
  }
  if (code === "permission-denied") {
    return "This live game could not be written. Try Share Live again.";
  }
  if (code === "unavailable") {
    return "Firebase is unreachable. Check gym Wi‑Fi, VPN, and ad blockers.";
  }
  return error instanceof Error ? error.message : "Could not start a live ScoreFlow session";
}

/** @deprecated Use liveErrorMessage */
export const authErrorMessage = liveErrorMessage;

export async function ensureAnonymousAuth(): Promise<User> {
  const { auth: firebaseAuth } = getFirebase();
  if (typeof firebaseAuth.authStateReady === "function") {
    await Promise.race([
      firebaseAuth.authStateReady(),
      new Promise<void>((resolve) => setTimeout(resolve, 1200))
    ]);
  }
  if (firebaseAuth.currentUser) {
    try {
      await firebaseAuth.currentUser.getIdToken();
    } catch {
      // Token refresh can fail offline; still try the live write.
    }
    return firebaseAuth.currentUser;
  }
  try {
    const credential = await signInAnonymously(firebaseAuth);
    if (!credential.user) throw new Error("Could not start a live ScoreFlow session");
    await credential.user.getIdToken();
    return credential.user;
  } catch (error) {
    throw new Error(liveErrorMessage(error));
  }
}

export function warmLiveAuth(): Promise<User | null> {
  if (!firebaseReady()) return Promise.resolve(null);
  warming ??= ensureAnonymousAuth().catch(() => {
    warming = null;
    return null;
  });
  return warming;
}
