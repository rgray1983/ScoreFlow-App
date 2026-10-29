import { browserStorage, readJson, type JsonStorage } from "./local";
export const SOUND_SETTINGS_KEY = "scoreflowSoundV1";
export type SoundSettings = { enabled: boolean; volume: number };
export function loadSoundSettings(storage?: JsonStorage | null): SoundSettings {
  const raw = readJson<Partial<SoundSettings> | null>(SOUND_SETTINGS_KEY, null, storage);
  return { enabled: raw?.enabled === true,
    volume: typeof raw?.volume === "number" && Number.isFinite(raw.volume) ? Math.max(0, Math.min(1, raw.volume)) : 0.5 };
}
export function saveSoundSettings(settings: SoundSettings, storage: JsonStorage | null = browserStorage()): boolean {
  try { if (!storage) return false; storage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(settings)); return true; }
  catch { return false; }
}
