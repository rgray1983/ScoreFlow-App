import { create } from "zustand";
import type { User } from "firebase/auth";
import {
  accountStatusText,
  emailSignIn,
  ensureAnonymousAuth,
  firebaseReady,
  hasCloudAccount,
  providerSignIn,
  signOutAccount,
  watchAuth
} from "../live/firebase";
import { mergeCloudHistory, syncLocalDataToCloud } from "../live/backup";
import { loadHomeTeam } from "../storage/homeTeam";
import { loadMatches } from "../storage/matchHistory";
import { matchHistoryLimit } from "../storage/premium";
import { usePremium } from "./premium";
import { toast } from "./toast";

type AccountState = {
  user: User | null;
  ready: boolean;
  busy: boolean;
  email: string;
  password: string;
  historyRevision: number;
  status: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  boot: () => void;
  signInEmail: (createAccount?: boolean) => Promise<void>;
  signInProvider: (provider: "google" | "apple") => Promise<void>;
  signOut: () => Promise<void>;
};

let watching = false;

async function afterSignedIn() {
  const premium = usePremium.getState();
  if (premium.isPro && premium.cloudBackup) {
    await syncLocalDataToCloud({
      premium: {
        isPro: premium.isPro,
        theme: premium.theme,
        posterStyle: premium.posterStyle,
        resultBackground: premium.resultBackground,
        cloudBackup: premium.cloudBackup
      },
      matches: loadMatches().slice(0, matchHistoryLimit(premium)),
      homeTeam: loadHomeTeam()
    });
  }
  await mergeCloudHistory(matchHistoryLimit(premium));
}

export const useAccount = create<AccountState>((set, get) => ({
  user: null,
  ready: !firebaseReady(),
  busy: false,
  email: "",
  password: "",
  historyRevision: 0,
  status: accountStatusText(null),
  setEmail(email) {
    set({ email });
  },
  setPassword(password) {
    set({ password });
  },
  boot() {
    if (!firebaseReady() || watching) {
      set({ ready: true, status: accountStatusText(get().user) });
      return;
    }
    watching = true;
    watchAuth((user) => {
      set({
        user,
        ready: true,
        status: accountStatusText(user),
        historyRevision: get().historyRevision + (hasCloudAccount(user) ? 1 : 0)
      });
      if (hasCloudAccount(user)) {
        void afterSignedIn().then(() => {
          set({ historyRevision: get().historyRevision + 1 });
        });
      }
    });
    void ensureAnonymousAuth().catch(() => {
      set({ ready: true });
    });
  },
  async signInEmail(createAccount = false) {
    if (!firebaseReady()) {
      toast("Firebase Auth is not ready", true);
      return;
    }
    set({ busy: true });
    try {
      await emailSignIn({
        email: get().email,
        password: get().password,
        createAccount
      });
      toast(createAccount ? "Account created" : "Signed in");
      set({ password: "" });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Sign in failed", true);
    } finally {
      set({ busy: false });
    }
  },
  async signInProvider(provider) {
    if (!firebaseReady()) {
      toast("Firebase Auth is not ready", true);
      return;
    }
    set({ busy: true });
    try {
      await providerSignIn(provider);
      toast("Signed in");
    } catch (error) {
      toast(error instanceof Error ? error.message : `${provider === "apple" ? "Apple" : "Google"} sign in needs to be enabled`, true);
    } finally {
      set({ busy: false });
    }
  },
  async signOut() {
    if (!hasCloudAccount(get().user)) return;
    set({ busy: true });
    try {
      const user = await signOutAccount();
      set({
        user,
        status: accountStatusText(user),
        password: ""
      });
      toast("Signed out");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Sign out failed", true);
    } finally {
      set({ busy: false });
    }
  }
}));
