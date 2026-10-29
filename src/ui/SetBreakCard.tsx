import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { pointsToWin, type MatchState } from "../scoring";
import { Button } from "./Button";
import styles from "./BoardAddons.module.css";

export function SetBreakCard({ match, onContinue, onUndo }: {
  match: MatchState; onContinue?: () => void; onUndo?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = match.pendingSet && !match.winner;
  const interactive = Boolean(onContinue);
  useLayoutEffect(() => {
    if (!open || !onContinue) return;
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, [open, interactive]);
  if (!open) return null;
  const last = match.completedSets.at(-1);
  const decider = match.setNumber === match.matchSets;
  const winner = last?.winner === "home" ? match.homeName : match.awayName;
  const contents = <div className={styles.setCard} data-decider={decider}>
    <p className={styles.eyebrow}>{decider ? "Winner takes it" : "Catch your breath"}</p>
    <h2 id="set-break-title">{decider ? "Deciding Set" : `Set ${match.setNumber}`}</h2>
    <p className={styles.setWinner}>{winner} took set {last?.set}</p>
    <div className={styles.setScores} aria-label="Completed sets">
      {match.completedSets.map((set) => <div key={set.set}>
        <span>SET {set.set}</span><strong>{set.homeScore} <span>–</span> {set.awayScore}</strong>
      </div>)}
    </div>
    <p className={styles.series}>{match.homeName} <strong>{match.homeSets} – {match.awaySets}</strong> {match.awayName}</p>
    <p className={styles.target}>First to {pointsToWin(match)} · Win by {match.winBy}</p>
    {onContinue ? <div className={styles.setActions}>
      <Button tone="gold" onClick={onContinue}>Start Set {match.setNumber}</Button>
      <Button tone="quiet" onClick={onUndo}>Undo last point</Button>
    </div> : <p className={styles.waiting}>Waiting for the scorer to start set {match.setNumber}…</p>}
  </div>;
  return createPortal(onContinue ? <dialog ref={dialog} className={styles.setDialog}
    aria-labelledby="set-break-title" onCancel={(event) => event.preventDefault()}>{contents}</dialog>
    : <div className={styles.setOverlay} role="status" aria-label={decider ? "Deciding set" : `Set ${match.setNumber} break`}>{contents}</div>, document.body);
}
