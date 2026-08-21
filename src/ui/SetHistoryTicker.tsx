import { useEffect, useMemo, useState } from "react";
import type { MatchState } from "../scoring";
import { setHistoryTickerItems } from "./boardChrome";
import styles from "../screens/MatchPage.module.css";

const ROTATE_MS = 5000;

export function SetHistoryTicker({ match }: { match?: MatchState | null }) {
  const items = useMemo(() => (match ? setHistoryTickerItems(match) : []), [match]);
  const signature = items.map((item) => item.key).join("|");
  const [index, setIndex] = useState(0);
  const [showing, setShowing] = useState(true);

  useEffect(() => {
    if (!items.length) {
      setIndex(0);
      setShowing(false);
      return;
    }
    setIndex(items.length - 1);
    setShowing(true);
  }, [items.length, signature]);

  useEffect(() => {
    if (items.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setShowing(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % items.length);
        setShowing(true);
      }, 90);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [items.length, signature]);

  if (!items.length) return null;
  const item = items[Math.min(index, items.length - 1)] ?? items[0];

  return (
    <div className={`${styles.ticker} ${styles.tickerOn}`} aria-live="polite">
      <p className={`${styles.tickerText} ${showing ? styles.tickerShowing : ""}`}>
        <span className={styles.tickerLabel}>{item.label}</span>{" "}
        <span className={styles.tickerWinner} style={{ ["--ticker-team-color" as string]: item.winnerColor }}>
          {item.detail}
        </span>
      </p>
    </div>
  );
}
