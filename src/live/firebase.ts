import { firebaseConfig } from "./config";
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type User
} from "firebase/auth";
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

export function currentAuthUser(): User | null {
  if (!firebaseReady()) return null;
  try {
    return getFirebase().auth.currentUser;
  } catch {
    return null;
  }
}

export function hasCloudAccount(user: User | null | undefined): user is User {
  return Boolean(user && !user.isAnonymous);
}

export function accountStatusText(user: User | null | undefined): string {
  if (hasCloudAccount(user)) return `Signed in as ${user?.email || "ScoreFlow user"}`;
  return "Guest mode — sign in to sync teams and history.";
}

export function accountChipText(user: User | null | undefined): string {
  return hasCloudAccount(user) ? (user?.email || "Signed In") : "Guest Mode";
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

export function signInErrorMessage(error: unknown, provider?: "google" | "apple"): string {
  if (provider) return `${provider === "apple" ? "Apple" : "Google"} sign in needs to be enabled`;
  return error instanceof Error ? error.message : "Sign in failed";
}

export async function ensureAnonymousAuth(): Promise<User> {
  const { auth: firebaseAuth } = getFirebase();
  if (typeof firebaseAuth.authStateReady === "function") {
    await firebaseAuth.authStateReady();
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

export function watchAuth(onUser: (user: User | null) => void): () => void {
  const { auth: firebaseAuth } = getFirebase();
  return onAuthStateChanged(firebaseAuth, onUser);
}

export async function emailSignIn(input: {
  email: string;
  password: string;
  createAccount?: boolean;
}): Promise<User> {
  const { auth: firebaseAuth } = getFirebase();
  const email = input.email.trim();
  const password = input.password;
  if (!email || password.length < 6) {
    throw new Error("Enter email and 6+ character password");
  }
  const user = firebaseAuth.currentUser;
  if (input.createAccount && user?.isAnonymous) {
    const linked = await linkWithCredential(user, EmailAuthProvider.credential(email, password));
    return linked.user;
  }
  if (input.createAccount) {
    const created = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    return created.user;
  }
  const signedIn = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return signedIn.user;
}

export async function providerSignIn(providerName: "google" | "apple"): Promise<User> {
  const { auth: firebaseAuth } = getFirebase();
  const provider = providerName === "apple"
    ? new OAuthProvider("apple.com")
    : new GoogleAuthProvider();
  const user = firebaseAuth.currentUser;
  try {
    if (user?.isAnonymous) {
      try {
        const linked = await linkWithPopup(user, provider);
        return linked.user;
      } catch (linkError) {
        const code = typeof linkError === "object" && linkError && "code" in linkError
          ? String(linkError.code)
          : "";
        if (code !== "auth/credential-already-in-use") throw linkError;
        const signedIn = await signInWithPopup(firebaseAuth, provider);
        return signedIn.user;
      }
    }
    const signedIn = await signInWithPopup(firebaseAuth, provider);
    return signedIn.user;
  } catch (error) {
    throw new Error(signInErrorMessage(error, providerName));
  }
}

export async function signOutAccount(): Promise<User | null> {
  const { auth: firebaseAuth } = getFirebase();
  if (!hasCloudAccount(firebaseAuth.currentUser)) return firebaseAuth.currentUser;
  await signOut(firebaseAuth);
  try {
    return await ensureAnonymousAuth();
  } catch {
    return null;
  }
}
