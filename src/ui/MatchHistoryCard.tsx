import { LogoMark } from "./LogoMark";
import type { HistoryMatch } from "../storage/matchHistory";
import styles from "./MatchHistoryCard.module.css";

type MatchHistoryCardProps = {
  match: HistoryMatch;
  onOpen: (match: HistoryMatch) => void;
};

export function MatchHistoryCard({ match, onOpen }: MatchHistoryCardProps) {
  return (
    <button
      className={`${styles.card} ${match.winnerSide === "home" ? styles.win : styles.loss}`}
      type="button"
      onClick={() => onOpen(match)}
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
  );
}
