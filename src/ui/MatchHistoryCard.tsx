import { useEffect, useRef, useState, type PointerEvent } from "react";
import { LogoMark } from "./LogoMark";
import type { HistoryMatch } from "../storage/matchHistory";
import { HISTORY_DELETE_WIDTH, snapHistorySwipe } from "./historySwipe";
import styles from "./MatchHistoryCard.module.css";

const SWIPE_EVENT = "scoreflow-history-swipe";

type MatchHistoryCardProps = {
  match: HistoryMatch;
  onOpen: (match: HistoryMatch) => void;
  onDelete: (match: HistoryMatch) => void;
};

export function MatchHistoryCard({ match, onOpen, onDelete }: MatchHistoryCardProps) {
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const startRef = useRef<{ x: number; y: number; offset: number; id: number } | null>(null);
  const draggingRef = useRef(false);
  const skipClickRef = useRef(false);
  offsetRef.current = offset;

  useEffect(() => {
    function onOtherSwipe(event: Event) {
      const openId = (event as CustomEvent<string>).detail;
      if (openId !== match.id) setOffset(0);
    }
    window.addEventListener(SWIPE_EVENT, onOtherSwipe);
    return () => window.removeEventListener(SWIPE_EVENT, onOtherSwipe);
  }, [match.id]);

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    startRef.current = { x: event.clientX, y: event.clientY, offset: offsetRef.current, id: event.pointerId };
    draggingRef.current = false;
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const start = startRef.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = start.x - event.clientX;
    const dy = event.clientY - start.y;
    if (!draggingRef.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        startRef.current = null;
        return;
      }
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add(styles.dragging);
      window.dispatchEvent(new CustomEvent(SWIPE_EVENT, { detail: match.id }));
    }
    const next = Math.max(0, Math.min(HISTORY_DELETE_WIDTH + 20, start.offset + dx));
    offsetRef.current = next;
    setOffset(next);
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const start = startRef.current;
    if (!start || start.id !== event.pointerId) return;
    const wasDrag = draggingRef.current;
    startRef.current = null;
    draggingRef.current = false;
    if (!wasDrag) return;
    skipClickRef.current = true;
    event.currentTarget.classList.remove(styles.dragging);
    setOffset(snapHistorySwipe(offsetRef.current));
  }

  function onCardClick() {
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    if (offsetRef.current > 8) {
      setOffset(0);
      return;
    }
    onOpen(match);
  }

  return (
    <div className={styles.row}>
      <button
        className={styles.delete}
        type="button"
        tabIndex={offset >= HISTORY_DELETE_WIDTH / 2 ? 0 : -1}
        aria-label={`Delete ${match.homeName} versus ${match.awayName} from match history`}
        onClick={() => onDelete(match)}
      >
        Delete
      </button>
      <button
        className={`${styles.card} ${match.winnerSide === "home" ? styles.win : styles.loss}`}
        type="button"
        style={{ transform: `translateX(${-offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onCardClick}
        aria-label={`View ${match.homeName} versus ${match.awayName} match details`}
      >
        <span className={`${styles.team} ${styles.home}`}>
          <LogoMark className={styles.logo} name={match.homeName} logo={match.homeLogo} />
          <span className={styles.name}>{match.homeName}</span>
        </span>
        <span className={styles.score}>
          {match.homeSets}
          <span>-</span>
          {match.awaySets}
        </span>
        <span className={`${styles.team} ${styles.away}`}>
          <span className={styles.name}>{match.awayName}</span>
          <LogoMark className={styles.logo} name={match.awayName} logo={match.awayLogo} />
        </span>
      </button>
    </div>
  );
}
