import { pointsToWin, type MatchState } from "../scoring";
import { Button } from "./Button";
import { PlayIcon } from "./icons";
import styles from "./PrematchOverlay.module.css";

type PrematchOverlayProps = {
  match: MatchState | null;
  ended: boolean;
  onWatch: () => void;
};

export function prematchMeta(match: MatchState | null, ended: boolean): string {
  if (ended) return "This live match has ended.";
  if (!match) return "Connecting…";
  return `Set ${match.setNumber} · Race to ${pointsToWin(match)}`;
}

export function PrematchOverlay({ match, ended, onWatch }: PrematchOverlayProps) {
  const title = ended ? "Match Ended" : match?.matchTitle || "Game Night";
  const home = match?.homeName || "Team 1";
  const away = match?.awayName || "Team 2";

  return (
    <div
      className={`${styles.overlay} ${ended ? styles.ended : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prematch-title"
    >
      <div className={styles.card}>
        <p className={styles.chip}>Live Match</p>
        <h2 id="prematch-title">{title}</h2>
        <p className={styles.matchup}>
          <strong>{home}</strong>
          <span>vs</span>
          <strong>{away}</strong>
        </p>
        <p className={styles.meta}>{prematchMeta(match, ended)}</p>
        {ended ? null : (
          <div className={styles.footer}>
            <Button type="button" onClick={onWatch}>
              <PlayIcon className={styles.play} />
              Watch Live Score
            </Button>
            <small className={styles.powered}>
              Powered by <img src="/scoreflow-logo.png" alt="ScoreFlow" />
            </small>
          </div>
        )}
        {ended ? (
          <small className={styles.powered}>
            Powered by <img src="/scoreflow-logo.png" alt="ScoreFlow" />
          </small>
        ) : null}
      </div>
    </div>
  );
}
