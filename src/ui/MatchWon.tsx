import type { ReactNode } from "react";
import type { MatchState } from "../scoring";
import { setWinnerColor } from "./boardChrome";
import { Button } from "./Button";
import styles from "../screens/MatchPage.module.css";

export function WinnerCelebration({
  name,
  onShowResults
}: {
  name: string;
  onShowResults: () => void;
}) {
  return (
    <div className={styles.winner} role="dialog" aria-labelledby="winner-celebrate-title">
      <button className={styles.winnerShade} type="button" aria-label="Show results" onClick={onShowResults} />
      <div className={styles.winnerCelebrate} onClick={onShowResults}>
        <div className={styles.winnerTrophy} aria-hidden="true">🏆</div>
        <h2 className={styles.winnerName} id="winner-celebrate-title">{name} Wins!</h2>
        <p className={styles.winnerHint}>Tap anywhere to close</p>
        <Button tone="gold" onClick={onShowResults}>Show Results</Button>
      </div>
    </div>
  );
}

export function MatchWonCard({
  match,
  children
}: {
  match: MatchState;
  children?: ReactNode;
}) {
  const winnerName = match.winner === "home" ? match.homeName : match.awayName;
  return (
    <div className={styles.winnerCard}>
      <p className={styles.winnerEyebrow}>Match won</p>
      <h2 className={styles.winnerName} id="winner-title">{winnerName}</h2>
      <ul className={styles.setList}>
        {match.completedSets.map((set) => (
          <li key={set.set} style={{ ["--set-winner-color" as string]: setWinnerColor(match, set) }}>
            <span>Set {set.set}</span>
            <strong>{set.homeScore}–{set.awayScore}</strong>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
