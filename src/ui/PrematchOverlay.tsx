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

export type EndedMatchup = {
  home: EndedMatchupSide;
  away: EndedMatchupSide;
  homeSets: number;
  awaySets: number;
};

export function prematchMeta(match: MatchState | null, ended: boolean): string {
  if (ended) return "This live match has ended.";
  if (!match) return "Connecting…";
  return `Set ${match.setNumber} · Race to ${pointsToWin(match)}`;
}

export function endedMatchup(
  match: MatchState | null,
  logos: { homeLogo?: string; awayLogo?: string } = {}
): EndedMatchup {
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
    },
    homeSets: match?.homeSets ?? 0,
    awaySets: match?.awaySets ?? 0
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
  const homeSide = ended ? matchup.home : { ...matchup.home, winner: false };
  const awaySide = ended ? matchup.away : { ...matchup.away, winner: false };
  const winnerName = homeSide.winner ? home : awaySide.winner ? away : "";
  const setScore = `${matchup.homeSets}-${matchup.awaySets}`;
  const matchupLabel = ended
    ? winnerName
      ? `${home} vs ${away}, ${setScore}. ${winnerName} won.`
      : `${home} vs ${away}, ${setScore}`
    : `${home} vs ${away}`;

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
        <div className={styles.logoMatchup} aria-label={matchupLabel}>
          <EndedSide {...homeSide} />
          <div className={styles.center}>
            <span className={styles.vs}>VS</span>
            {ended ? (
              <p className={styles.setScore} aria-hidden="true">
                <strong>{matchup.homeSets}</strong>
                <span>-</span>
                <strong>{matchup.awaySets}</strong>
              </p>
            ) : null}
          </div>
          <EndedSide {...awaySide} />
        </div>
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
