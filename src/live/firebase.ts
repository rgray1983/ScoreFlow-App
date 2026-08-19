import { firebaseConfig } from "./config";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, type Auth, type User } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function firebaseReady(): boolean {
  return Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId);
}

export function getFirebase() {
  if (!firebaseReady()) {
    throw new Error("Firebase config is missing.");
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
  return { app, auth: auth!, db: db!, storage: storage! };
}

export function authErrorMessage(error: unknown): string {
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
  return error instanceof Error ? error.message : "Could not start a live ScoreFlow session";
}

export async function ensureAnonymousAuth(): Promise<User> {
  const { auth: firebaseAuth } = getFirebase();
  if (typeof firebaseAuth.authStateReady === "function") {
    await Promise.race([
      firebaseAuth.authStateReady(),
      new Promise<void>((resolve) => {
        setTimeout(resolve, 4000);
      })
    ]);
  }
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser;
  try {
    const credential = await signInAnonymously(firebaseAuth);
    if (!credential.user) throw new Error("Could not start a live ScoreFlow session");
    return credential.user;
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }
}
