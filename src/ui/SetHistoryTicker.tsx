import { useMemo } from "react";
import type { MatchState } from "../scoring";
import { setHistoryTickerCopy, setHistoryTickerItems } from "./boardChrome";
import styles from "../screens/MatchPage.module.css";

export function SetHistoryTicker({ match }: { match?: MatchState | null }) {
  const items = useMemo(() => (match ? setHistoryTickerItems(match) : []), [match]);
  const copy = setHistoryTickerCopy(items);
  const duration = Math.max(14, copy.length * 0.18);

  if (!items.length || !copy) return null;

  return (
    <div className={`${styles.ticker} ${styles.tickerOn}`} aria-live="polite">
      <div className={styles.tickerTrack} style={{ ["--ticker-duration" as string]: `${duration}s` }}>
        <p className={styles.tickerCopy}>{tickerItems(items)}</p>
        <p className={styles.tickerCopy} aria-hidden="true">{tickerItems(items)}</p>
      </div>
    </div>
  );
}

function tickerItems(items: ReturnType<typeof setHistoryTickerItems>) {
  return items.map((item, index) => (
    <span key={`${item.key}-${index}`} className={styles.tickerItem}>
      <span className={styles.tickerLabel}>{item.label}</span>{" "}
      <span className={styles.tickerWinner} style={{ ["--ticker-team-color" as string]: item.winnerColor }}>
        {item.detail}
      </span>
      <span className={styles.tickerDot} aria-hidden="true">•</span>
    </span>
  ));
}
