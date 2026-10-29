import { withBase } from "../lib/base";
import { SOUND_CUES, type SoundCue } from "./events";

// One audio context per mounted board; decoded clips are reused. No audio work
// runs on the scoring path, and newer actions interrupt old sequences.
export class BoardAudio {
  private context: AudioContext | null = null;
  private buffers = new Map<SoundCue, AudioBuffer>();
  private sources: AudioBufferSourceNode[] = [];
  private gain: GainNode | null = null;
  private generation = 0;
  private disposed = false;
  private loading: Promise<void> | null = null;

  constructor(private onInactive: () => void = () => {}) {}

  async enable(volume: number): Promise<boolean> {
    const generation = ++this.generation;
    try {
      if (this.disposed) return false;
      this.context ??= new AudioContext();
      const context = this.context;
      context.onstatechange = () => { if (context.state !== "running" && !this.disposed) this.onInactive(); };
      this.gain ??= context.createGain();
      this.gain.disconnect(); this.gain.connect(context.destination);
      this.setVolume(volume);
      // Called directly from the Enable sound tap, before the first await.
      const resumed = context.resume();
      this.loading ??= Promise.all(SOUND_CUES.map(async (cue) => {
        const response = await fetch(withBase(`sounds/${cue}.mp3`));
        if (!response.ok) throw new Error("Sound unavailable");
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(cue, buffer);
      })).then(() => {}).catch((error: unknown) => { this.loading = null; throw error; });
      await Promise.all([resumed, this.loading]);
      return !this.disposed && generation === this.generation && context.state === "running";
    } catch { return false; }
  }

  setVolume(volume: number) {
    if (this.gain) this.gain.gain.value = Math.max(0, Math.min(1, volume));
  }

  stop() {
    for (const source of this.sources) { try { source.stop(); } catch { /* Already ended. */ } source.disconnect(); }
    this.sources = [];
  }

  play(cues: readonly SoundCue[]) {
    this.stop();
    const context = this.context;
    if (!context || context.state !== "running" || !this.gain) return;
    let start = context.currentTime;
    try {
      for (const cue of cues) {
        const buffer = this.buffers.get(cue);
        if (!buffer) continue;
        const source = context.createBufferSource();
        source.buffer = buffer; source.connect(this.gain);
        this.sources.push(source); source.start(start);
        start += buffer.duration + 0.08;
      }
    } catch { this.stop(); } // Audio failure must never affect scoring.
  }

  disable() { this.generation += 1; this.stop(); }
  dispose() { this.disposed = true; this.disable(); void this.context?.close().catch(() => {}); }
}
