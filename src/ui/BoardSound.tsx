import { useEffect, useRef, useState } from "react";
import type { MatchState } from "../scoring";
import { SoundCursor } from "../audio/events";
import { BoardAudio } from "../audio/player";
import { loadSoundSettings, saveSoundSettings, type SoundSettings } from "../storage/sound";
import { toast } from "../state/toast";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import styles from "./BoardSound.module.css";

type Props = { match?: MatchState | null; active: boolean; session: string; className?: string; remoteOnly?: boolean };
export function BoardSound({ match, active, session, className, remoteOnly = false }: Props) {
  const [settings, setSettings] = useState(loadSoundSettings);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const audio = useRef<BoardAudio | null>(null);
  const cursor = useRef(new SoundCursor());
  const mounted = useRef(false);
  const lastId = useRef<string | undefined>(undefined);
  const event = match?.lastSound;

  useEffect(() => {
    mounted.current = true;
    audio.current = new BoardAudio(() => setReady(false));
    return () => { mounted.current = false; audio.current?.dispose(); audio.current = null; };
  }, []);

  useEffect(() => {
    const visible = document.visibilityState === "visible";
    const cues = cursor.current.take(session, event, active && visible && ready && settings.enabled, Date.now(), remoteOnly);
    if (lastId.current !== event?.id || !active || !ready || !settings.enabled) audio.current?.stop();
    lastId.current = event?.id;
    if (cues.length) audio.current?.play(cues);
  }, [session, event, active, ready, settings.enabled, remoteOnly]);

  useEffect(() => {
    const quiet = () => {
      cursor.current.silenceThrough(Date.now());
      if (document.visibilityState !== "visible") {
        audio.current?.stop();
        cursor.current.take(session, event, false, Date.now());
      } else {
        cursor.current.take(session, event, active && ready && settings.enabled, Date.now(), remoteOnly);
      }
    };
    document.addEventListener("visibilitychange", quiet);
    return () => document.removeEventListener("visibilitychange", quiet);
  }, [session, event, active, ready, settings.enabled, remoteOnly]);

  useEffect(() => {
    if (!remoteOnly) return;
    const quiet = () => { cursor.current.silenceThrough(Date.now()); audio.current?.stop(); };
    window.addEventListener("offline", quiet);
    window.addEventListener("online", quiet);
    return () => { window.removeEventListener("offline", quiet); window.removeEventListener("online", quiet); };
  }, [remoteOnly]);

  function save(next: SoundSettings) {
    setSettings(next);
    if (!saveSoundSettings(next)) toast("Sound changed for this visit. This browser could not save it.");
  }

  async function enable() {
    if (loading) return;
    setLoading(true); setFailed(false);
    const current = audio.current;
    const ok = await current?.enable(settings.volume);
    if (!mounted.current || current !== audio.current) return;
    setLoading(false); setReady(Boolean(ok)); setFailed(!ok);
    if (ok) { cursor.current.silenceThrough(Date.now()); save({ ...settings, enabled: true }); }
  }

  function mute() {
    audio.current?.disable(); setReady(false); setFailed(false);
    save({ ...settings, enabled: false });
  }

  return <>
    <button type="button" className={className} aria-label="Sound settings" aria-pressed={settings.enabled && ready}
      title={settings.enabled && ready ? "Sound on" : "Sound off"} onClick={() => setOpen(true)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {settings.enabled && ready ? <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /> : <path d="m16 9 6 6m0-6-6 6" />}
      </svg>
    </button>
    <Dialog open={open} title="Sound" cancelLabel="Done" onCancel={() => setOpen(false)}>
      <div className={styles.controls}>
        <p role="status">{loading ? "Loading sounds…" : failed ? "Sound unavailable. Try enabling it again." : settings.enabled && ready ? "Sound on" : "Sound off"}</p>
        {settings.enabled && ready ? <Button tone="quiet" onClick={mute}>Mute sound</Button> :
          <Button onClick={() => void enable()} disabled={loading}>Enable sound</Button>}
        <label htmlFor="sound-volume">Volume <output>{Math.round(settings.volume * 100)}%</output></label>
        <input id="sound-volume" type="range" min="0" max="100" step="5" value={Math.round(settings.volume * 100)}
          onChange={(e) => { const volume = Number(e.target.value) / 100; audio.current?.setVolume(volume); save({ ...settings, volume }); }} />
        <Button tone="quiet" disabled={!ready || !settings.enabled} onClick={() => audio.current?.play(["point"])}>Test sound</Button>
      </div>
    </Dialog>
  </>;
}
