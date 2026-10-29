import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { BoardTheme, HighlightCall, HighlightKind, MatchState, Side } from "../scoring";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { runHeat } from "./boardEnergy";
import styles from "./BoardAddons.module.css";

export function ScoreDigits({ value, theme }: { value: number; theme: BoardTheme }) {
  if (theme !== "flip-clock") return <>{value}</>;
  return <span className={styles.digits}>{String(value).padStart(2, "0").split("").map((digit, index) => (
    <span className={styles.digit} key={`${index}-${digit}`}>{digit}</span>
  ))}</span>;
}

export function RunBadge({ match, side }: { match: MatchState; side: Side }) {
  if (runHeat(match, side) < 2) return null;
  return <span className={styles.run} data-testid={`run-${side}`}>
    <span aria-hidden="true">{match.runLength >= 7 ? "🔥" : "↗"}</span> {match.runLength}–0 RUN
  </span>;
}

export function ScorerCredit({ name = "" }: { name?: string }) {
  const clean = name.trim().slice(0, 32);
  return clean ? <p className={styles.credit} title={`Scored by ${clean}`}>Scored by <strong>{clean}</strong></p> : null;
}

const BOARD_STYLES: { id: BoardTheme; name: string; description: string }[] = [
  { id: "classic", name: "Classic", description: "Glass & court" },
  { id: "old-school", name: "Old School", description: "Gym lights & LED" },
  { id: "flip-clock", name: "Flip Clock", description: "Split-flap digits" }
];

export function BoardStylePicker({ open, theme, onSelect, onClose }: {
  open: boolean; theme: BoardTheme; onSelect: (theme: BoardTheme) => void; onClose: () => void;
}) {
  return <Dialog open={open} title="Board style" eyebrow="Set the scene" onCancel={onClose} cancelLabel="Done">
    <div className={styles.styles}>
      {BOARD_STYLES.map((item) => <button type="button" key={item.id} aria-pressed={item.id === theme}
        className={styles.styleChoice} onClick={() => onSelect(item.id)}>
        <span className={styles.preview} data-look={item.id} aria-hidden="true">24<span>:</span>23</span>
        <strong>{item.name}</strong><small>{item.description}</small>
      </button>)}
    </div>
  </Dialog>;
}

export function HighlightPicker({ side, match, onCall, onClose }: {
  side: Side | null; match: MatchState; onCall: (side: Side, kind: HighlightKind) => void; onClose: () => void;
}) {
  const name = side === "home" ? match.homeName : match.awayName;
  return <Dialog open={side !== null} title="Make the call" eyebrow={name}
    copy="Adds one point and celebrates the play." onCancel={onClose} actions={<Button tone="quiet" onClick={onClose}>Cancel</Button>}>
    <div className={styles.calls}>
      {(["ace", "kill", "block"] as const).map((kind) => <button type="button" key={kind}
        onClick={() => { if (side) onCall(side, kind); }}>
        <span aria-hidden="true">{kind === "ace" ? "ϟ" : kind === "kill" ? "✦" : "▰"}</span>
        <strong>{kind}!</strong><small>+1</small>
      </button>)}
    </div>
  </Dialog>;
}

// IDs are observed once, including on first load. Undo and reconnect cannot replay old hits.
function useHighlightFx(call: HighlightCall | null) {
  const seen = useRef(new Set(call ? [call.id] : []));
  const [active, setActive] = useState<HighlightCall | null>(null);
  const id = call?.id;
  useEffect(() => {
    setActive(null);
    if (!call || seen.current.has(call.id)) return;
    seen.current.add(call.id);
    if (seen.current.size > 80) seen.current.delete(seen.current.values().next().value!);
    const remaining = 1800 - Math.max(0, Date.now() - call.atMs);
    if (remaining <= 0) return;
    setActive(call);
    const timer = window.setTimeout(() => setActive(null), remaining);
    return () => window.clearTimeout(timer);
  }, [id]);
  return active?.id === id ? active : null;
}

export function HighlightBurst({ match }: { match?: MatchState | null }) {
  const call = useHighlightFx(match?.lastHighlight ?? null);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !call) return;
    // Nonmodal top layer keeps the hit above a set-break card without stealing focus.
    node.showPopover?.();
    return () => node.hidePopover?.();
  }, [call?.id]);
  if (!call || !match || call.player) return null;
  const color = call.side === "home" ? match.homeColor : match.awayColor;
  const name = call.side === "home" ? match.homeName : match.awayName;
  return <div ref={ref} popover="manual" key={call.id} className={styles.burst} data-kind={call.kind}
    data-testid="highlight-burst" style={{ ["--hit-color" as string]: color }} aria-live="polite">
    <div className={styles.impact} aria-hidden="true" />
    <strong>{call.kind}!</strong><span>{name}</span>
  </div>;
}
