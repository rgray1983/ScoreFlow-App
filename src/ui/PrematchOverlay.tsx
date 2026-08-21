import { resultsTeamNameLines } from "../graphics/results";
import { pointsToWin, type MatchState } from "../scoring";
import { Button } from "./Button";
import { PlayIcon } from "./icons";
import { LogoMark } from "./LogoMark";
import styles from "./PrematchOverlay.module.css";

type PrematchOverlayProps = {
  match: MatchState | null;
  ended: boolean;
  onWatch: () => void;
  homeLogo?: string;
  awayLogo?: string;
};

export type EndedMatchupSide = {
  name: string;
  lines: string[];
  logo: string;
  winner: boolean;
};

export function prematchMeta(match: MatchState | null, ended: boolean): string {
  if (ended) return "This live match has ended.";
  if (!match) return "Connecting…";
  return `Set ${match.setNumber} · Race to ${pointsToWin(match)}`;
}

export function endedMatchup(
  match: MatchState | null,
  logos: { homeLogo?: string; awayLogo?: string } = {}
): { home: EndedMatchupSide; away: EndedMatchupSide } {
  const homeName = match?.homeName || "Team 1";
  const awayName = match?.awayName || "Team 2";
  return {
    home: {
      name: homeName,
      lines: resultsTeamNameLines(homeName),
      logo: logos.homeLogo || "",
      winner: match?.winner === "home"
    },
    away: {
      name: awayName,
      lines: resultsTeamNameLines(awayName),
      logo: logos.awayLogo || "",
      winner: match?.winner === "away"
    }
  };
}

function EndedSide({ name, lines, logo, winner }: EndedMatchupSide) {
  return (
    <div className={`${styles.side} ${winner ? styles.winner : ""}`}>
      <LogoMark className={styles.logo} name={name} logo={logo} />
      {winner ? <span className={styles.winnerChip}>Winner</span> : null}
      <strong className={styles.teamName}>
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </strong>
    </div>
  );
}

export function PrematchOverlay({ match, ended, onWatch, homeLogo = "", awayLogo = "" }: PrematchOverlayProps) {
  const title = ended ? "Match Ended" : match?.matchTitle || "Game Night";
  const home = match?.homeName || "Team 1";
  const away = match?.awayName || "Team 2";
  const matchup = endedMatchup(match, { homeLogo, awayLogo });
  const winnerName = matchup.home.winner ? home : matchup.away.winner ? away : "";

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
        {ended ? (
          <div
            className={styles.endedMatchup}
            aria-label={winnerName ? `${home} vs ${away}. ${winnerName} won.` : `${home} vs ${away}`}
          >
            <EndedSide {...matchup.home} />
            <span className={styles.vs}>VS</span>
            <EndedSide {...matchup.away} />
          </div>
        ) : (
          <p className={styles.matchup}>
            <strong>{home}</strong>
            <span>vs</span>
            <strong>{away}</strong>
          </p>
        )}
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
