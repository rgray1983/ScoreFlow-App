import { readJson, writeJson, type JsonStorage } from "./local";
import { FREE_MATCH_HISTORY_LIMIT } from "./matchHistory";

export const PREMIUM_KEY = "scoreflowPremiumV1";
export const PRO_MATCH_HISTORY_LIMIT = 10000;

export type ThemeId = "classic" | "championship" | "neon" | "midnight" | "ice" | "fire";
export type ResultBackgroundId =
  | "default"
  | "default-blue"
  | "water-color"
  | "blue-wave"
  | "gold-bracket"
  | "neon-lights"
  | "power-hitter";
export type PosterStyle = "classic" | "championship" | "neon" | "spotlight";

export type ThemeOption = {
  id: ThemeId;
  name: string;
  pro: boolean;
  tag: string;
};

export type ResultBackgroundOption = {
  id: ResultBackgroundId;
  name: string;
  file: string;
  pro: boolean;
};

export type PremiumSettings = {
  isPro: boolean;
  theme: ThemeId;
  posterStyle: PosterStyle;
  resultBackground: ResultBackgroundId;
  cloudBackup: boolean;
};

export const PREMIUM_THEMES: ThemeOption[] = [
  { id: "classic", name: "Classic", pro: false, tag: "Free" },
  { id: "championship", name: "Championship Gold", pro: true, tag: "Pro" },
  { id: "neon", name: "Neon Arena", pro: true, tag: "Pro" },
  { id: "midnight", name: "Midnight Glass", pro: true, tag: "Pro" },
  { id: "ice", name: "Ice Court", pro: true, tag: "Pro" },
  { id: "fire", name: "Firestorm", pro: true, tag: "Pro" }
];

export const POSTER_STYLES: PosterStyle[] = ["classic", "championship", "neon", "spotlight"];

export const RESULTS_BACKGROUNDS: ResultBackgroundOption[] = [
  { id: "default", name: "Default", file: "default.jpg", pro: false },
  { id: "default-blue", name: "Default Blue", file: "default-blue.png", pro: false },
  { id: "water-color", name: "Water Color", file: "water-color.png", pro: true },
  { id: "blue-wave", name: "Blue Wave", file: "blue-wave.png", pro: true },
  { id: "gold-bracket", name: "Gold Bracket", file: "gold-bracket.png", pro: true },
  { id: "neon-lights", name: "Neon Lights", file: "neon-lights.png", pro: true },
  { id: "power-hitter", name: "Power Hitter", file: "power-hitter.png", pro: true }
];

export const DEFAULT_PREMIUM: PremiumSettings = {
  isPro: false,
  theme: "classic",
  posterStyle: "classic",
  resultBackground: "default",
  cloudBackup: false
};

export function themeById(id: unknown): ThemeOption {
  return PREMIUM_THEMES.find((theme) => theme.id === id) || PREMIUM_THEMES[0];
}

export function resultBackgroundById(id: unknown): ResultBackgroundOption {
  return RESULTS_BACKGROUNDS.find((item) => item.id === id) || RESULTS_BACKGROUNDS[0];
}

export function hasProAccess(premium: Pick<PremiumSettings, "isPro">): boolean {
  return Boolean(premium.isPro);
}

export function matchHistoryLimit(premium: Pick<PremiumSettings, "isPro">): number {
  return hasProAccess(premium) ? PRO_MATCH_HISTORY_LIMIT : FREE_MATCH_HISTORY_LIMIT;
}

export function normalizeTheme(themeId: unknown, isPro: boolean): ThemeId {
  const theme = themeById(themeId);
  return theme.pro && !isPro ? "classic" : theme.id;
}

export function normalizePosterStyle(style: unknown, isPro: boolean): PosterStyle {
  const next = POSTER_STYLES.includes(style as PosterStyle) ? style as PosterStyle : "classic";
  return next !== "classic" && !isPro ? "classic" : next;
}

export function normalizeResultBackground(backgroundId: unknown, isPro: boolean): ResultBackgroundId {
  const bg = resultBackgroundById(backgroundId);
  return bg.pro && !isPro ? "default" : bg.id;
}

export function resultsBackgroundSrc(backgroundId: unknown): string {
  return `/images/results/${resultBackgroundById(backgroundId).file}`;
}

export function parsePremium(value: unknown): PremiumSettings {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const isPro = Boolean(record.isPro);
  const cloudBackup = Boolean(record.cloudBackup) && isPro;
  return {
    isPro,
    theme: normalizeTheme(record.theme, isPro),
    posterStyle: normalizePosterStyle(record.posterStyle, isPro),
    resultBackground: normalizeResultBackground(record.resultBackground, isPro),
    cloudBackup
  };
}

export function loadPremium(storage?: JsonStorage): PremiumSettings {
  return parsePremium(readJson(PREMIUM_KEY, DEFAULT_PREMIUM, storage));
}

export function savePremium(premium: PremiumSettings, storage?: JsonStorage): PremiumSettings {
  const next = parsePremium(premium);
  writeJson(PREMIUM_KEY, next, storage);
  return next;
}

export function toggleProPreview(premium: PremiumSettings): PremiumSettings {
  if (premium.isPro) {
    return parsePremium({
      ...premium,
      isPro: false,
      theme: "classic",
      posterStyle: "classic",
      cloudBackup: false,
      resultBackground: resultBackgroundById(premium.resultBackground).pro ? "default" : premium.resultBackground
    });
  }
  return parsePremium({
    ...premium,
    isPro: true,
    cloudBackup: true
  });
}

export function applyPremiumToDocument(premium: PremiumSettings): void {
  if (typeof document === "undefined") return;
  document.body.dataset.theme = premium.theme;
  document.body.classList.toggle("pro-active", hasProAccess(premium));
}
