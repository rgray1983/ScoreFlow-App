import { useEffect, useRef, useState } from "react";
import type { MatchState, Side } from "../scoring";
import { detectBoardFx, boardFxKey } from "./boardChrome";

export function useBoardFx(match?: MatchState | null) {
  const previous = useRef<MatchState | null>(null);
  const [pointSide, setPointSide] = useState<Side | null>(null);
  const [pointKey, setPointKey] = useState(0);
  const [setWinnerSide, setSetWinnerSide] = useState<Side | null>(null);
  const [setWinnerKey, setSetWinnerKey] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const key = boardFxKey(match);

  useEffect(() => {
    if (!match) {
      previous.current = null;
      return;
    }
    const prev = previous.current;
    previous.current = match;
    if (!prev) return;
    const fx = detectBoardFx(prev, match);
    if (fx.pointSide) {
      setPointSide(fx.pointSide);
      setPointKey(Date.now());
    }
    if (fx.setWinnerSide) {
      setSetWinnerSide(fx.setWinnerSide);
      setSetWinnerKey(Date.now());
      setConfetti(!match.winner);
    }
  }, [key, match]);

  useEffect(() => {
    if (!pointKey) return;
    const timer = window.setTimeout(() => setPointSide(null), 1150);
    return () => window.clearTimeout(timer);
  }, [pointKey]);

  useEffect(() => {
    if (!setWinnerKey) return;
    const timer = window.setTimeout(() => setSetWinnerSide(null), 3000);
    return () => window.clearTimeout(timer);
  }, [setWinnerKey]);

  useEffect(() => {
    if (!confetti) return;
    const timer = window.setTimeout(() => setConfetti(false), 1600);
    return () => window.clearTimeout(timer);
  }, [confetti]);

  return { pointSide, pointKey, setWinnerSide, setWinnerKey, confetti };
}
