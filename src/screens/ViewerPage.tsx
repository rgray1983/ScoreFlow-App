import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { matchBanner } from "../scoring";
import {
  ensureAnonymousAuth,
  listenLiveGame,
  listenViewerCount,
  writePresence,
  type LiveGameView
} from "../live";
import { FanZone } from "../ui/FanZone";
import { TeamName } from "../ui/TeamName";
import { LivePill } from "../ui/LivePill";
import { LogoMark } from "../ui/LogoMark";
import { MatchWonCard, WinnerCelebration } from "../ui/MatchWon";
import { PrematchOverlay } from "../ui/PrematchOverlay";
import { BoardFxBanners } from "../ui/BoardFxBanners";
import { SetHistoryTicker } from "../ui/SetHistoryTicker";
import { ConfettiBurst } from "../ui/ConfettiBurst";
import { useBoardFx } from "../ui/useBoardFx";
import styles from "./MatchPage.module.css";
import viewerStyles from "./ViewerPage.module.css";

export function ViewerPage() {
  const { gameId = "" } = useParams();
  const [game, setGame] = useState<LiveGameView | null>(null);
  const [missing, setMissing] = useState(false);
  const [status, setStatus] = useState<"offline" | "live" | "error">("offline");
  const [viewers, setViewers] = useState(0);
  const [watching, setWatching] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);

  useEffect(() => {
    setWatching(false);
    setResultsOpen(false);
  }, [gameId]);

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
        const beat = () => {
          void writePresence(gameId, "viewer");
        };
        beat();
        heartbeat = window.setInterval(beat, 15000);
        stopCount = listenViewerCount(gameId, setViewers);
        stopGame = listenLiveGame(gameId, (next) => {
          if (!next) {
            setStatus("offline");
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
  const ended = Boolean(game?.ended);
  const matchWon = Boolean(match?.winner);
  const showCelebration = watching && matchWon && !ended;
  const showPrematch = !watching || ended;
  const banner = match ? matchBanner(match) : missing ? "GAME NOT FOUND" : "CONNECTING";
  const alert = banner.startsWith("SET POINT") || banner.startsWith("MATCH POINT") || banner.startsWith("MATCH WON") || banner === "GAME NOT FOUND";
  const fx = useBoardFx(watching && !ended ? match : null);
  const winnerName = match?.winner === "home" ? match.homeName : match?.awayName || "";

  return (
    <div
      className={`${styles.page} ${viewerStyles.page}`}
      style={match ? { ["--home" as string]: match.homeColor, ["--away" as string]: match.awayColor } : undefined}
    >
      <header className={styles.topBar}>
        <span className={styles.left} />
        <img className={styles.logo} src="/scoreflow-logo.png" alt="ScoreFlow" />
        <div className={styles.status}>
          <span className={styles.viewers}><span className={styles.viewersLabel}>Viewers </span>{viewers}</span>
          <LivePill status={status} />
        </div>
        <SetHistoryTicker match={match} />
      </header>

      <main className={styles.board} aria-label="Live volleyball scoreboard">
        <section className={`${styles.team} ${styles.home}`}>
          <div className={styles.identity}>
            <LogoMark className={styles.teamLogo} name={match?.homeName || "Home"} logo={game?.homeLogo} color={match?.homeColor} />
            <div>
              <TeamName className={styles.teamName} name={match?.homeName || "Home"} />
              <span className={styles.sets}>Sets {match?.homeSets ?? 0}</span>
            </div>
          </div>
        </section>

        <section className={styles.center}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>{match?.matchTitle || "ScoreFlow"}</h1>
            <p className={styles.setBox}><span>Set <strong>{match?.setNumber ?? 1}</strong></span></p>
            <p className={`${styles.race} ${alert ? styles.raceAlert : ""}`}>{banner}</p>
            {match ? (
              <BoardFxBanners
                match={match}
                pointSide={fx.pointSide}
                pointKey={fx.pointKey}
                setWinnerSide={fx.setWinnerSide}
                setWinnerKey={fx.setWinnerKey}
              />
            ) : null}
          </div>
          <div className={styles.scoreRow} aria-label="Current score">
            <span className={`${styles.score} ${styles.homeScore}`}>{match?.homeScore ?? 0}</span>
            <span className={styles.colon} aria-hidden="true" />
            <span className={`${styles.score} ${styles.awayScore}`}>{match?.awayScore ?? 0}</span>
          </div>
        </section>

        <section className={`${styles.team} ${styles.away}`}>
          <div className={styles.identity}>
            <LogoMark className={styles.teamLogo} name={match?.awayName || "Visitor"} logo={game?.awayLogo} color={match?.awayColor} />
            <div>
              <TeamName className={styles.teamName} name={match?.awayName || "Visitor"} />
              <span className={styles.sets}>Sets {match?.awaySets ?? 0}</span>
            </div>
          </div>
        </section>
      </main>

      {match ? (
        <ConfettiBurst
          active={fx.confetti}
          colors={[match.homeColor, match.awayColor, "#ffd166", "#ffffff", "#ff3b30"]}
        />
      ) : null}

      {showCelebration && !resultsOpen && match ? (
        <WinnerCelebration
          compact
          name={winnerName}
          colors={[match.homeColor, match.awayColor, "#ffd166", "#ffffff", "#ff3b30"]}
          onShowResults={() => setResultsOpen(true)}
        />
      ) : null}

      {showCelebration && resultsOpen && match ? (
        <div className={styles.winner} role="status">
          <div className={styles.winnerShade} />
          <MatchWonCard match={match} />
        </div>
      ) : null}

      {showPrematch ? (
        <PrematchOverlay
          match={match ?? null}
          ended={ended}
          homeLogo={game?.homeLogo}
          awayLogo={game?.awayLogo}
          onWatch={() => setWatching(true)}
        />
      ) : null}

      {gameId ? (
        <FanZone
          gameId={gameId}
          chatPaused={Boolean(game?.chatPaused)}
          ended={ended}
          askName={watching && !ended}
        />
      ) : null}
    </div>
  );
}
