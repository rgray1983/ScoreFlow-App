import { expect, it } from "vitest";
import { memoryStorage } from "./local";
import { loadSoundSettings, saveSoundSettings, SOUND_SETTINGS_KEY } from "./sound";
it("defaults to muted and remembers device-only sound and volume settings", () => {
  const storage = memoryStorage();
  expect(loadSoundSettings(storage)).toEqual({ enabled: false, volume: 0.5 });
  expect(saveSoundSettings({ enabled: true, volume: 0.35 }, storage)).toBe(true);
  expect(loadSoundSettings(storage)).toEqual({ enabled: true, volume: 0.35 });
  storage.setItem(SOUND_SETTINGS_KEY, '{"enabled":"yes","volume":7}');
  expect(loadSoundSettings(storage)).toEqual({ enabled: false, volume: 1 });
  expect(saveSoundSettings({ enabled: false, volume: 0.5 }, null)).toBe(false);
  expect(saveSoundSettings({ enabled: false, volume: 0.5 }, { ...storage, setItem() { throw Error("blocked"); } })).toBe(false);
});
