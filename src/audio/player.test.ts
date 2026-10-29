import { afterEach, expect, it, vi } from "vitest";
import { BoardAudio } from "./player";
const sources: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[] = [];
const resume = vi.fn(async () => {});
const close = vi.fn(async () => {});
class FakeContext {
  state = "running"; currentTime = 12; destination = {}; onstatechange = null;
  resume = resume; close = close;
  createGain() { return { gain: { value: 0 }, connect() {}, disconnect() {} }; }
  async decodeAudioData() { return { duration: 1.5 }; }
  createBufferSource() {
    const source = { start: vi.fn(), stop: vi.fn(), connect() {}, disconnect() {}, buffer: null };
    sources.push(source); return source;
  }
}
afterEach(() => { vi.unstubAllGlobals(); sources.length = 0; vi.clearAllMocks(); });
it("unlocks from a gesture, sequences cues, and cancels old audio on new actions and mute", async () => {
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
  const player = new BoardAudio();
  const enabling = player.enable(0.5);
  expect(resume).toHaveBeenCalledTimes(1); // Before fetching/decoding finishes.
  expect(await enabling).toBe(true);
  player.play(["kill", "on-fire"]);
  expect(sources[0].start).toHaveBeenCalledWith(12);
  expect(sources[1].start).toHaveBeenCalledWith(13.58);
  player.play(["point"]);
  expect(sources[0].stop).toHaveBeenCalledTimes(1);
  expect(sources[1].stop).toHaveBeenCalledTimes(1);
  player.disable(); expect(sources[2].stop).toHaveBeenCalledTimes(1);
  player.dispose(); expect(close).toHaveBeenCalledTimes(1);
});
it("contains unavailable/blocked audio and cannot finish enabling after disposal", async () => {
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
  const player = new BoardAudio();
  expect(await player.enable(0.5)).toBe(false);
  expect(() => player.play(["point"])).not.toThrow();
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
  const enabling = player.enable(0.5); player.dispose();
  expect(await enabling).toBe(false);
});
