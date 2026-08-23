import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import type { User } from "firebase/auth";
import type { HomeTeam } from "../storage/homeTeam";
import {
  loadMatches,
  mergeMatchHistory,
  parseHistoryMatch,
  removeMatch,
  saveMatches,
  type HistoryMatch
} from "../storage/matchHistory";
import type { PremiumSettings } from "../storage/premium";
import { parseAccountProfile, type AccountProfile } from "../storage/accountProfile";
import { currentAuthUser, firebaseReady, getFirebase, hasCloudAccount } from "./firebase";

const CLOUD_MATCH_WRITE_LIMIT = 20;

export function canWriteCloudBackup(input: {
  user?: User | null;
  isPro: boolean;
  cloudBackup: boolean;
}): boolean {
  return Boolean(input.isPro && input.cloudBackup && hasCloudAccount(input.user ?? currentAuthUser()));
}

function cloudUser(): User | null {
  const user = currentAuthUser();
  return hasCloudAccount(user) ? user : null;
}

function teamIdFromName(name: string, fallback: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `team-${slug || fallback}`;
}

export async function syncPremiumToCloud(premium: PremiumSettings): Promise<void> {
  if (!firebaseReady() || !canWriteCloudBackup({ isPro: premium.isPro, cloudBackup: premium.cloudBackup })) return;
  const user = cloudUser();
  if (!user) return;
  const { db } = getFirebase();
  try {
    await setDoc(doc(db, "users", user.uid, "settings", "premium"), {
      ...premium,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now()
    }, { merge: true });
  } catch (error) {
    console.warn("Premium settings backup failed", error);
  }
}

export async function syncAccountProfileToCloud(profile: AccountProfile): Promise<void> {
  if (!firebaseReady()) return;
  const user = cloudUser();
  if (!user) return;
  const { db } = getFirebase();
  try {
    await setDoc(doc(db, "users", user.uid, "settings", "profile"), {
      displayName: profile.displayName,
      avatar: profile.avatar,
      updatedAtMs: profile.updatedAtMs,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.warn("Account profile backup failed", error);
  }
}

export async function pullCloudAccountProfile(): Promise<AccountProfile | null> {
  if (!firebaseReady()) return null;
  const user = cloudUser();
  if (!user) return null;
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, "users", user.uid, "settings", "profile"));
  if (!snap.exists()) return null;
  return parseAccountProfile(snap.data());
}

async function saveCloudTeam(user: User, team: {
  id: string;
  name: string;
  color: string;
  logo: string;
  favorite: boolean;
  updatedAtMs: number;
}): Promise<void> {
  const { db } = getFirebase();
  await setDoc(doc(db, "users", user.uid, "teams", team.id), {
    ...team,
    updatedAt: serverTimestamp(),
    updatedAtMs: Date.now()
  }, { merge: true });
}

export async function syncHomeTeamToCloud(homeTeam: HomeTeam | null): Promise<void> {
  if (!homeTeam || !firebaseReady()) return;
  const user = cloudUser();
  if (!user) return;
  await saveCloudTeam(user, {
    id: teamIdFromName(homeTeam.name, "home"),
    name: homeTeam.name,
    color: homeTeam.color,
    logo: homeTeam.logo,
    favorite: true,
    updatedAtMs: homeTeam.updatedAtMs
  });
}

export async function syncMatchesToCloud(matches: HistoryMatch[]): Promise<void> {
  if (!firebaseReady()) return;
  const user = cloudUser();
  if (!user) return;
  const { db } = getFirebase();
  await Promise.allSettled(matches.slice(0, CLOUD_MATCH_WRITE_LIMIT).map((match) =>
    setDoc(doc(db, "users", user.uid, "matches", match.id), {
      ...match,
      updatedAt: serverTimestamp()
    }, { merge: true })
  ));
}

export async function backupCompletedMatch(match: HistoryMatch, premium: PremiumSettings): Promise<void> {
  if (!canWriteCloudBackup({ isPro: premium.isPro, cloudBackup: premium.cloudBackup })) return;
  await syncMatchesToCloud([match]);
}

export async function syncLocalDataToCloud(input: {
  premium: PremiumSettings;
  matches: HistoryMatch[];
  homeTeam: HomeTeam | null;
}): Promise<void> {
  if (!canWriteCloudBackup({ isPro: input.premium.isPro, cloudBackup: input.premium.cloudBackup })) return;
  await syncPremiumToCloud(input.premium);
  try {
    await syncHomeTeamToCloud(input.homeTeam);
  } catch (error) {
    console.warn("Home team backup failed", error);
  }
  try {
    await syncMatchesToCloud(input.matches);
  } catch (error) {
    console.warn("Match history backup failed", error);
  }
}

export async function pullCloudMatches(limitCount: number): Promise<HistoryMatch[]> {
  if (!firebaseReady()) return [];
  const user = cloudUser();
  if (!user) return [];
  const { db } = getFirebase();
  const snap = await getDocs(query(
    collection(db, "users", user.uid, "matches"),
    orderBy("updatedAtMs", "desc"),
    limit(limitCount)
  ));
  return snap.docs
    .map((item) => parseHistoryMatch({ id: item.id, ...item.data() }))
    .filter((item): item is HistoryMatch => Boolean(item));
}

export async function deleteCloudMatch(matchId: string): Promise<void> {
  if (!firebaseReady() || !matchId) return;
  const user = cloudUser();
  if (!user) return;
  try {
    const { db } = getFirebase();
    await deleteDoc(doc(db, "users", user.uid, "matches", matchId));
  } catch (error) {
    console.warn("Match history delete failed", error);
  }
}

export function deleteHistoryMatch(matchId: string): HistoryMatch[] {
  const next = removeMatch(matchId);
  void deleteCloudMatch(matchId);
  return next;
}

export async function mergeCloudHistory(limitCount: number): Promise<HistoryMatch[]> {
  const local = loadMatches();
  if (!firebaseReady() || !hasCloudAccount(currentAuthUser())) return local;
  try {
    const cloud = await pullCloudMatches(limitCount);
    const merged = mergeMatchHistory(local, cloud, limitCount);
    return saveMatches(merged, undefined, limitCount);
  } catch (error) {
    console.warn(error);
    return local;
  }
}
