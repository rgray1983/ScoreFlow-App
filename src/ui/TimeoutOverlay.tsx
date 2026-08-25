import { useEffect, useState } from "react";
import { formatTimeoutClock, type MatchState } from "../scoring";
import styles from "./TimeoutOverlay.module.css";

type TimeoutOverlayProps = {
  match: MatchState;
  remainingMs: number;
  compact?: boolean;
  onEnd?: () => void;
};

export function useTimeoutRemaining(endsAtMs: number, active: boolean) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 200);
    return () => window.clearInterval(id);
  }, [active, endsAtMs]);

  if (!active || endsAtMs <= 0) return 0;
  return Math.max(0, endsAtMs - Date.now());
}

export function TimeoutOverlay({
  match,
  remainingMs,
  compact = false,
  onEnd
}: TimeoutOverlayProps) {
  if (!match.activeTimeout || remainingMs <= 0) return null;

  const name = match.activeTimeout === "home" ? match.homeName : match.awayName;
  const color = match.activeTimeout === "home" ? match.homeColor : match.awayColor;
  const clock = formatTimeoutClock(remainingMs);
  const className = `${styles.overlay} ${compact ? styles.compact : styles.viewer}`;

  return (
    <div
      className={className}
      style={{ ["--timeout-color" as string]: color }}
      role="status"
      aria-live="polite"
      data-testid={compact ? "timeout-scorer" : "timeout-viewer"}
    >
      <div className={styles.card}>
        <p className={styles.eyebrow}>Timeout</p>
        <strong className={styles.team}>{name}</strong>
        <span className={styles.clock}>{clock}</span>
        {onEnd ? (
          <button className={styles.end} type="button" onClick={onEnd}>
            End timeout
          </button>
        ) : null}
      </div>
    </div>
  );
}
