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
import { mergeCloudHistory, pullCloudAccountProfile, syncAccountProfileToCloud, syncLocalDataToCloud } from "../live/backup";
import { loadHomeTeam } from "../storage/homeTeam";
import { loadMatches } from "../storage/matchHistory";
import { matchHistoryLimit } from "../storage/premium";
import {
  loadAccountProfile,
  mergeAccountProfiles,
  profileAvatar,
  profileDisplayName,
  saveAccountProfile,
  seedProfileFromUser,
  type AccountProfile
} from "../storage/accountProfile";
import { updateAuthProfile } from "../live/firebase";
import { uploadUserAvatar } from "../live/logos";
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
  displayName: string;
  avatar: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  boot: () => void;
  signInEmail: (createAccount?: boolean) => Promise<void>;
  signInProvider: (provider: "google" | "apple") => Promise<void>;
  signOut: () => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  setAvatar: (avatar: string) => Promise<void>;
};

function profileFields(profile: AccountProfile, user: User | null) {
  const seeded = seedProfileFromUser(profile, user);
  return {
    displayName: profileDisplayName(seeded, user),
    avatar: profileAvatar(seeded, user)
  };
}

async function persistProfile(profile: AccountProfile, user: User | null): Promise<AccountProfile> {
  const seeded = seedProfileFromUser(profile, user);
  const saved = saveAccountProfile(seeded);
  if (hasCloudAccount(user)) {
    let avatar = saved.avatar;
    if (saved.avatar) {
      try {
        avatar = (await uploadUserAvatar(user.uid, saved.avatar)) || saved.avatar;
      } catch {
        avatar = saved.avatar;
      }
    }
    const next = saveAccountProfile({ ...saved, avatar, updatedAtMs: Date.now() });
    await syncAccountProfileToCloud(next);
    try {
      await updateAuthProfile({
        displayName: next.displayName || user.displayName || undefined,
        photoURL: next.avatar.startsWith("http") ? next.avatar : undefined
      });
    } catch {
      // Auth profile is best-effort; local and Firestore still hold the scorer card.
    }
    return next;
  }
  return saved;
}

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

async function hydrateCloudProfile(user: User | null): Promise<AccountProfile> {
  let profile = seedProfileFromUser(loadAccountProfile(), user);
  if (hasCloudAccount(user)) {
    try {
      const cloud = await pullCloudAccountProfile();
      profile = mergeAccountProfiles(profile, cloud);
    } catch {
      // Keep the on-device profile if cloud read fails.
    }
    profile = await persistProfile(profile, user);
  } else {
    profile = saveAccountProfile(profile);
  }
  return profile;
}

const initialProfile = loadAccountProfile();

export const useAccount = create<AccountState>((set, get) => ({
  user: null,
  ready: !firebaseReady(),
  busy: false,
  email: "",
  password: "",
  historyRevision: 0,
  status: accountStatusText(null),
  ...profileFields(initialProfile, null),
  setEmail(email) {
    set({ email });
  },
  setPassword(password) {
    set({ password });
  },
  boot() {
    if (!firebaseReady() || watching) {
      set({
        ready: true,
        status: accountStatusText(get().user),
        ...profileFields(loadAccountProfile(), get().user)
      });
      return;
    }
    watching = true;
    watchAuth((user) => {
      set({
        user,
        ready: true,
        status: accountStatusText(user),
        historyRevision: get().historyRevision + (hasCloudAccount(user) ? 1 : 0),
        ...profileFields(loadAccountProfile(), user)
      });
      void hydrateCloudProfile(user).then((profile) => {
        set({
          ...profileFields(profile, user),
          historyRevision: get().historyRevision + (hasCloudAccount(user) ? 1 : 0)
        });
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
      const profile = loadAccountProfile();
      set({
        user,
        status: accountStatusText(user),
        password: "",
        ...profileFields(profile, user)
      });
      toast("Signed out");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Sign out failed", true);
    } finally {
      set({ busy: false });
    }
  },
  async setDisplayName(name) {
    const profile = await persistProfile({
      ...loadAccountProfile(),
      displayName: name,
      updatedAtMs: Date.now()
    }, get().user);
    set(profileFields(profile, get().user));
    toast("Display name saved");
  },
  async setAvatar(avatar) {
    const profile = await persistProfile({
      ...loadAccountProfile(),
      avatar,
      updatedAtMs: Date.now()
    }, get().user);
    set(profileFields(profile, get().user));
    toast("Photo saved");
  }
}));
