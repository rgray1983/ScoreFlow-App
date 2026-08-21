import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MatchState } from "../scoring";
import { setHistoryTickerItems, tickerCopyCount, tickerLoopOffset } from "./boardChrome";
import styles from "../screens/MatchPage.module.css";

const TICKER_PX_PER_SEC = 72;

export function SetHistoryTicker({ match }: { match?: MatchState | null }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<HTMLParagraphElement>(null);
  const items = useMemo(() => (match ? setHistoryTickerItems(match) : []), [match]);
  const [copies, setCopies] = useState(2);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const loop = loopRef.current;
    if (!wrap || !loop || !items.length) return;

    const update = () => {
      const next = tickerCopyCount(loop.offsetWidth, wrap.clientWidth);
      setCopies((prev) => (prev === next ? prev : next));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(wrap);
    observer.observe(loop);
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const track = trackRef.current;
    const loop = loopRef.current;
    if (!track || !loop || !items.length) return;

    let offset = 0;
    let frame = 0;
    let last = performance.now();
    const landscape = window.matchMedia("(orientation: landscape)");

    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 1000;
      last = now;
      if (landscape.matches) {
        offset = tickerLoopOffset(offset - TICKER_PX_PER_SEC * dt, loop.offsetWidth);
        track.style.transform = `translate3d(${offset}px, 0, 0)`;
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [items, copies]);

  if (!items.length) return null;

  return (
    <div ref={wrapRef} className={`${styles.ticker} ${styles.tickerOn}`} aria-live="polite">
      <div ref={trackRef} className={`${styles.tickerTrack} scoreflow-ticker-track`}>
        {Array.from({ length: copies }, (_, copyIndex) => (
          <p
            key={copyIndex}
            ref={copyIndex === 0 ? loopRef : undefined}
            className={styles.tickerCopy}
            aria-hidden={copyIndex > 0 ? true : undefined}
          >
            {tickerItems(items, copyIndex)}
          </p>
        ))}
      </div>
    </div>
  );
}

function tickerItems(items: ReturnType<typeof setHistoryTickerItems>, copyIndex: number) {
  return items.map((item, index) => (
    <span key={`${copyIndex}-${item.key}-${index}`} className={styles.tickerItem}>
      <span className={styles.tickerLabel}>{item.label}</span>{" "}
      <span className={styles.tickerWinner} style={{ ["--ticker-team-color" as string]: item.winnerColor }}>
        {item.detail}
      </span>
      <span className={styles.tickerDot} aria-hidden="true">•</span>
    </span>
  ));
}
