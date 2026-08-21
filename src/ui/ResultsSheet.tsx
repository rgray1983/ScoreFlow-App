import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { shareResultsGraphic, resultsTeamNameLines } from "../graphics/results";
import {
  formatMatchDate,
  matchSetCount,
  type HistoryMatch
} from "../storage/matchHistory";
import { resultsBackgroundSrc } from "../storage/premium";
import { Button } from "./Button";
import { LogoMark } from "./LogoMark";
import { withBase } from "../lib/base";
import { usePortraitLock } from "./portraitLock";
import styles from "./ResultsSheet.module.css";

type ResultsSheetProps = {
  open: boolean;
  match: HistoryMatch | null;
  onClose: () => void;
};

export function ResultsSheet({ open, match, onClose }: ResultsSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  usePortraitLock(open);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) {
      try {
        node.showModal();
      } catch {
        node.setAttribute("open", "");
      }
    }
    return () => {
      if (node.open) node.close();
    };
  }, [open]);

  useEffect(() => {
    if (open) setHint("");
  }, [open, match?.id]);

  if (!open || !match || typeof document === "undefined") return null;

  const recap = match;
  const rows = Array.from({ length: matchSetCount(recap) }, (_, index) => recap.completedSets[index] ?? null);

  async function share() {
    setBusy(true);
    setHint("");
    try {
      await shareResultsGraphic(recap);
    } catch {
      setHint("Results image could not be created");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="results-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button className={styles.close} type="button" aria-label="Close results" onClick={onClose}>
        ×
      </button>
      <div className={styles.rotatePrompt}>
        <p>Turn your phone upright</p>
        <strong>Match Results is portrait-only</strong>
        <small>Rotate to see the recap graphic and share it.</small>
      </div>
      <article
        className={styles.card}
        style={{
          ["--results-home-score-color" as string]: match.homeColor,
          ["--results-away-score-color" as string]: match.awayColor,
          ["--results-background-image" as string]: `url("${resultsBackgroundSrc(match.resultBackground)}")`
        }}
      >
        <time className={styles.date}>{formatMatchDate(match.updatedAtMs)}</time>
        <div className={styles.topLogo}>
          <LogoMark className={styles.mainLogo} name={match.homeName} logo={match.homeLogo} />
        </div>
        <div className={styles.titleBlock}>
          <span>Match Result</span>
          <h3 id="results-title">{match.title}</h3>
        </div>
        <div className={styles.matchup}>
          <ResultsSide
            name={match.homeName}
            logo={match.homeLogo}
            winner={match.winnerSide === "home"}
          />
          <span className={styles.vs}>VS</span>
          <ResultsSide
            name={match.awayName}
            logo={match.awayLogo}
            winner={match.winnerSide === "away"}
          />
        </div>
        <div className={styles.table} aria-label="Set scores">
          {rows.map((set, index) => (
            <div
              key={set ? `set-${set.set}` : `empty-${index}`}
              className={styles.row}
              style={{ ["--row-delay" as string]: `${index * 95}ms` }}
            >
              <strong>{set ? set.homeScore : "–"}</strong>
              <span />
              <strong>{set ? set.awayScore : "–"}</strong>
            </div>
          ))}
        </div>
        <small className={styles.powered}>
          Presented by <img src={withBase("scoreflow-logo.png")} alt="ScoreFlow" />
        </small>
      </article>
      <div className={styles.actions}>
        <Button tone="gold" disabled={busy} onClick={() => void share()}>
          {busy ? "Preparing…" : "Share/Download Results"}
        </Button>
        {hint ? <p className={styles.hint}>{hint}</p> : null}
      </div>
    </dialog>,
    document.body
  );
}

function ResultsSide({
  name,
  logo,
  winner
}: {
  name: string;
  logo: string;
  winner: boolean;
}) {
  return (
    <div className={`${styles.side} ${winner ? styles.winner : ""}`}>
      <LogoMark className={styles.logo} name={name} logo={logo} />
      {winner ? <span className={styles.winnerChip}>Winner</span> : null}
      <strong className={styles.teamName}>
        {resultsTeamNameLines(name).map((line) => (
          <span key={line}>{line}</span>
        ))}
      </strong>
    </div>
  );
}
