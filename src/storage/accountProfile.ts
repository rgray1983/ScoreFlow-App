import type { User } from "firebase/auth";
import { readJson, writeJson, type JsonStorage } from "./local";

export const ACCOUNT_PROFILE_KEY = "scoreflowAccountProfileV1";
export const ACCOUNT_NAME_MAX = 32;

export type AccountProfile = {
  displayName: string;
  avatar: string;
  updatedAtMs: number;
};

export const EMPTY_ACCOUNT_PROFILE: AccountProfile = {
  displayName: "",
  avatar: "",
  updatedAtMs: 0
};

export function parseAccountProfile(value: unknown): AccountProfile {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    displayName: String(record.displayName || "").trim().slice(0, ACCOUNT_NAME_MAX),
    avatar: String(record.avatar || "").trim(),
    updatedAtMs: Number(record.updatedAtMs) || 0
  };
}

export function loadAccountProfile(storage?: JsonStorage): AccountProfile {
  return parseAccountProfile(readJson(ACCOUNT_PROFILE_KEY, EMPTY_ACCOUNT_PROFILE, storage));
}

export function saveAccountProfile(profile: AccountProfile, storage?: JsonStorage): AccountProfile {
  const next = parseAccountProfile({
    ...profile,
    updatedAtMs: profile.updatedAtMs || Date.now()
  });
  writeJson(ACCOUNT_PROFILE_KEY, next, storage);
  return next;
}

export function profileInitials(name: string, email = ""): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  }
  if (words[0]) return words[0].slice(0, 2).toUpperCase();
  const local = email.split("@")[0] || "";
  return local.slice(0, 2).toUpperCase() || "S";
}

export function profileDisplayName(profile: AccountProfile, user?: User | null): string {
  return profile.displayName.trim()
    || user?.displayName?.trim()
    || user?.email?.split("@")[0]
    || "";
}

export function profileAvatar(profile: AccountProfile, user?: User | null): string {
  return profile.avatar.trim() || user?.photoURL || "";
}

export function seedProfileFromUser(profile: AccountProfile, user: User | null | undefined): AccountProfile {
  if (!user || user.isAnonymous) return profile;
  const displayName = profile.displayName.trim() || String(user.displayName || "").trim().slice(0, ACCOUNT_NAME_MAX);
  const avatar = profile.avatar.trim() || user.photoURL || "";
  if (displayName === profile.displayName && avatar === profile.avatar) return profile;
  return {
    displayName,
    avatar,
    updatedAtMs: Date.now()
  };
}

export function mergeAccountProfiles(local: AccountProfile, cloud: AccountProfile | null): AccountProfile {
  if (!cloud) return local;
  if ((cloud.updatedAtMs || 0) > (local.updatedAtMs || 0)) return parseAccountProfile(cloud);
  return local;
}
