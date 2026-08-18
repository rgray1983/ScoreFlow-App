import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { isMatchOver, matchBanner } from "../scoring";
import { matchFormatLabel } from "../storage/matchSetup";
import {
  ensureAnonymousAuth,
  listenLiveGame,
  listenViewerCount,
  writePresence,
  type LiveGameView
} from "../live";
import { LivePill } from "../ui/LivePill";
import { LogoMark } from "../ui/LogoMark";
import styles from "./MatchPage.module.css";
import viewerStyles from "./ViewerPage.module.css";

export function ViewerPage() {
  const { gameId = "" } = useParams();
  const [game, setGame] = useState<LiveGameView | null>(null);
  const [missing, setMissing] = useState(false);
  const [status, setStatus] = useState<"offline" | "live" | "error">("offline");
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    document.documentElement.classList.add("viewer-mode");
    return () => document.documentElement.classList.remove("viewer-mode");
  }, []);

  useEffect(() => {
    if (!gameId) {
      setMissing(true);
      return;
    }
    let stopGame: (() => void) | undefined;
    let stopCount: (() => void) | undefined;
    let heartbeat = 0;
    let cancelled = false;

    void (async () => {
      try {
        await ensureAnonymousAuth();
        if (cancelled) return;
        await writePresence(gameId, "viewer");
        heartbeat = window.setInterval(() => {
          void writePresence(gameId, "viewer");
        }, 15000);
        stopCount = listenViewerCount(gameId, setViewers);
        stopGame = listenLiveGame(gameId, (next) => {
          if (!next) {
            setMissing(true);
            setStatus("error");
            return;
          }
          setMissing(false);
          setGame(next);
          setStatus(next.ended ? "offline" : "live");
        });
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
      stopGame?.();
      stopCount?.();
    };
  }, [gameId]);

  const match = game?.match;
  const banner = match ? matchBanner(match) : missing ? "GAME NOT FOUND" : "CONNECTING";
  const alert = banner.startsWith("SET POINT") || banner.startsWith("MATCH POINT") || banner.startsWith("MATCH WON") || banner === "GAME NOT FOUND";

  return (
    <div
      className={`${styles.page} ${viewerStyles.page}`}
      style={match ? { ["--home" as string]: match.homeColor, ["--away" as string]: match.awayColor } : undefined}
    >
      <header className={styles.topBar}>
        <img className={styles.logo} src="/scoreflow-logo.png" alt="ScoreFlow" />
        <div className={styles.status}>
          <span className={styles.viewers}>Viewers {viewers}</span>
          <LivePill status={status} />
        </div>
      </header>

      <main className={styles.board} aria-label="Live volleyball scoreboard">
        <section className={`${styles.team} ${styles.home}`}>
          <div className={styles.identity}>
            <LogoMark className={styles.teamLogo} name={match?.homeName || "Home"} logo={game?.homeLogo} color={match?.homeColor} />
            <div>
              <span className={styles.teamName}>{match?.homeName || "Home"}</span>
              <span className={styles.sets}>Sets {match?.homeSets ?? 0}</span>
            </div>
          </div>
        </section>

        <section className={styles.center}>
          <span className={styles.pill}>{match ? matchFormatLabel(match.matchFormat) : "Live viewer"}</span>
          <h1 className={styles.title}>{match?.matchTitle || "ScoreFlow"}</h1>
          <p className={styles.setLabel}>{match ? `SET ${match.setNumber}` : "SET"}</p>
          <p className={`${styles.race} ${alert ? styles.raceAlert : ""}`}>{banner}</p>
          <div className={styles.scoreRow} aria-label="Current score">
            <span className={`${styles.score} ${styles.homeScore}`}>{match?.homeScore ?? 0}</span>
            <span className={styles.colon} aria-hidden="true">:</span>
            <span className={`${styles.score} ${styles.awayScore}`}>{match?.awayScore ?? 0}</span>
          </div>
        </section>

        <section className={`${styles.team} ${styles.away}`}>
          <div className={styles.identity}>
            <LogoMark className={styles.teamLogo} name={match?.awayName || "Visitor"} logo={game?.awayLogo} color={match?.awayColor} />
            <div>
              <span className={styles.teamName}>{match?.awayName || "Visitor"}</span>
              <span className={styles.sets}>Sets {match?.awaySets ?? 0}</span>
            </div>
          </div>
        </section>
      </main>

      {match && isMatchOver(match) && match.winner ? (
        <div className={styles.winner} role="status">
          <div className={styles.winnerShade} />
          <div className={styles.winnerCard}>
            <p className={styles.winnerEyebrow}>Match won</p>
            <h2>{match.winner === "home" ? match.homeName : match.awayName}</h2>
            <ul className={styles.setList}>
              {match.completedSets.map((set) => (
                <li key={set.set}>
                  <span>Set {set.set}</span>
                  <strong>{set.homeScore}–{set.awayScore}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
