import { useEffect, useRef, useState } from "react";
import type { HighlightKind } from "../scoring";
import type { RosterPlayer } from "../storage/teams";
import styles from "./RosterDrawer.module.css";

export function RosterDrawer({ roster, disabled, onCall }: {
  roster: RosterPlayer[]; disabled: boolean;
  onCall: (player: RosterPlayer, kind: HighlightKind) => void;
}) {
  const [open, setOpen] = useState(false);
  const [player, setPlayer] = useState<RosterPlayer | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const actions = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const committed = useRef(false);
  useEffect(() => {
    const node = dialog.current;
    if (open && !disabled) node?.showModal(); else node?.close();
    return () => node?.close();
  }, [open, disabled]);
  useEffect(() => { if (player) actions.current?.focus(); }, [player]);
  function close() { setOpen(false); setPlayer(null); trigger.current?.focus(); }
  return <>
    <button ref={trigger} className={styles.tab} type="button" disabled={disabled} aria-expanded={open && !disabled}
      aria-controls="scorer-roster" onClick={() => { committed.current = false; setPlayer(null); setOpen(true); }}>Roster</button>
    <dialog ref={dialog} id="scorer-roster" className={styles.drawer} aria-labelledby="roster-title"
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClick={(e) => { if (e.target === dialog.current) { const r = dialog.current.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right) close(); } }}>
      <header className={styles.header}><strong id="roster-title">Your Team</strong><button type="button" aria-label="Close roster" onClick={close}>×</button></header>
      <div className={styles.viewport}><div className={`${styles.track} ${player ? styles.selected : ""}`}>
        <section className={styles.panel} aria-label="Roster players" inert={player !== null}>
          <p>Choose a player</p>
          {roster.map((p) => <button type="button" key={p.id} className={styles.player} onClick={() => setPlayer(p)}>
            <span>{p.number ? `#${p.number}` : "•"}</span><strong>{p.name}</strong><span>›</span>
          </button>)}
        </section>
        <section className={styles.panel} aria-label="Player actions" inert={player === null}>
          <button type="button" className={styles.back} onClick={() => { setPlayer(null); dialog.current?.querySelector<HTMLButtonElement>(`[aria-label="Close roster"]`)?.focus(); }}>‹ Players</button>
          <h2>{player?.number ? `#${player.number} ` : ""}{player?.name}</h2><p>Each action adds one point.</p>
          {(["ace", "kill", "block"] as const).map((kind, index) => <button ref={index === 0 ? actions : undefined} type="button" className={styles.action} key={kind}
            aria-label={`${kind[0].toUpperCase()}${kind.slice(1)} for ${player?.name || "player"}, add one point`}
            onClick={() => { if (!player || disabled || committed.current) return; committed.current = true; onCall(player, kind); close(); }}>
            <strong>{kind}</strong><span>+1</span>
          </button>)}
        </section>
      </div></div>
    </dialog>
  </>;
}
