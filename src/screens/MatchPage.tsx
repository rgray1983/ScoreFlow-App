import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  canUndo,
  isMatchOver,
  matchBanner,
  type Side
} from "../scoring";
import { matchHasProgress } from "../storage/matchEngine";
import { historyMatchFromLive } from "../storage/matchHistory";
import { consumeResumeIntent, isDocumentReload, shouldResumeLiveOnMatchPage } from "../state/homeResume";
import { useWorkspace } from "../state/workspace";
import { liveViewerUrl, useLiveSession } from "../state/liveSession";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { FanZone } from "../ui/FanZone";
import { ResultsSheet } from "../ui/ResultsSheet";
import { ShareSheet } from "../ui/ShareSheet";
import { HomeIcon, SettingsIcon, ShareIcon, UndoIcon } from "../ui/icons";
import { LivePill } from "../ui/LivePill";
import { LogoMark } from "../ui/LogoMark";
import styles from "./MatchPage.module.css";

function useScorePop(score: number) {
  const [pop, setPop] = useState(false);
  const previous = useRef(score);
  useEffect(() => {
    if (previous.current === score) return;
    previous.current = score;
    setPop(true);
    const timer = window.setTimeout(() => setPop(false), 280);
    return () => window.clearTimeout(timer);
  }, [score]);
  return pop;
}

export function MatchPage() {
  const navigate = useNavigate();
  const draft = useWorkspace((state) => state.draft);
  const engine = useWorkspace((state) => state.engine);
  const dispatch = useWorkspace((state) => state.dispatch);
  const live = useLiveSession();
  const match = engine.match;
  const over = isMatchOver(match);
  const banner = matchBanner(match);
  const alert = banner.startsWith("SET POINT") || banner.startsWith("MATCH POINT") || banner.startsWith("MATCH WON");
  const homePop = useScorePop(match.homeScore);
  const awayPop = useScorePop(match.awayScore);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [winnerOpen, setWinnerOpen] = useState(Boolean(match.winner));
  const [recapOpen, setRecapOpen] = useState(false);
  const [setFlash, setSetFlash] = useState("");
  const previousSets = useRef(match.completedSets.length);

  useEffect(() => {
    setWinnerOpen(Boolean(match.winner));
  }, [match.winner]);

  useEffect(() => {
    const count = match.completedSets.length;
    if (count > previousSets.current && !match.winner) {
      const last = match.completedSets[count - 1];
      const name = last.winner === "home" ? match.homeName : match.awayName;
      setSetFlash(`${name} wins Set ${last.set}`);
      const timer = window.setTimeout(() => setSetFlash(""), 1400);
      previousSets.current = count;
      return () => window.clearTimeout(timer);
    }
    previousSets.current = count;
    return undefined;
  }, [match.completedSets, match.winner, match.homeName, match.awayName]);

  useEffect(() => {
    live.dismissReturnPrompt();
    const session = useLiveSession.getState();
    if (
      shouldResumeLiveOnMatchPage({
        hasRecovery: Boolean(session.recovery?.gameId),
        liveActive: session.active,
        resumeIntent: consumeResumeIntent(),
        documentReload: isDocumentReload()
      })
    ) {
      void session.resumeLive(match, draft);
    }
  }, []);

  function score(side: Side) {
    dispatch({ type: "point", side });
  }

  function minus(side: Side) {
    dispatch({ type: "subtract", side });
  }

  function startNewMatch() {
    dispatch({ type: "newMatch" });
    setConfirmOpen(false);
    setWinnerOpen(false);
    setRecapOpen(false);
    setSetFlash("");
  }

  function requestNewMatch() {
    if (!matchHasProgress(engine) || match.winner) {
      startNewMatch();
      return;
    }
    setConfirmOpen(true);
  }

  function requestHome() {
    if (live.active) {
      setLeaveOpen(true);
      return;
    }
    navigate("/");
  }

  function requestShare() {
    void useLiveSession.getState().goLive(match, draft);
  }

  function openRecap() {
    setWinnerOpen(false);
    setRecapOpen(true);
  }

  function closeWinner() {
    setWinnerOpen(false);
  }

  function closeRecap() {
    setRecapOpen(false);
    if (match.winner) setWinnerOpen(true);
  }

  function endMatch() {
    void live.endLive().finally(() => navigate("/"));
  }

  const recapMatch = historyMatchFromLive({
    match,
    homeLogo: draft.homeLogo,
    awayLogo: draft.awayLogo
  });

  return (
    <div
      className={`${styles.page} ${styles.scorer}`}
      style={{ ["--home" as string]: match.homeColor, ["--away" as string]: match.awayColor }}
    >
      <header className={styles.topBar}>
        <div className={styles.left}>
          <button className={styles.iconButton} type="button" aria-label="Home" onClick={requestHome}>
            <HomeIcon className={styles.icon} />
          </button>
          <Link className={styles.iconButton} to="/setup" state={{ fromMatch: true }} aria-label="Match setup">
            <SettingsIcon className={styles.icon} />
          </Link>
        </div>
        <img className={styles.logo} src="/scoreflow-logo.png" alt="ScoreFlow" />
        <div className={styles.status}>
          <span className={styles.viewers}><span className={styles.viewersLabel}>Viewers </span>{live.viewerCount}</span>
          {live.active ? (
            <button
              className={styles.chatPause}
              type="button"
              onClick={() => void live.setChatPaused(!live.chatPaused)}
            >
              {live.chatPaused ? "Chat Off" : "Chat On"}
            </button>
          ) : null}
          <LivePill status={live.status} />
        </div>
      </header>

      <main className={styles.board} aria-label="Volleyball scoreboard">
        <section className={`${styles.team} ${styles.home}`}>
          <div className={styles.identity}>
            <LogoMark className={styles.teamLogo} name={match.homeName} logo={draft.homeLogo} color={match.homeColor} />
            <div>
              <span className={styles.teamName}>{match.homeName}</span>
              <span className={styles.sets}>Sets {match.homeSets}</span>
            </div>
          </div>
          <div className={styles.pointActions}>
            <button
              className={`${styles.point} ${styles.plus}`}
              type="button"
              disabled={over}
              aria-label={`Add point to ${match.homeName}`}
              onClick={() => score("home")}
            >
              +1
            </button>
            <button
              className={`${styles.point} ${styles.minus}`}
              type="button"
              disabled={over || match.homeScore <= 0}
              aria-label={`Subtract point from ${match.homeName}`}
              onClick={() => minus("home")}
            >
              −1
            </button>
          </div>
        </section>

        <section className={styles.center}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>{match.matchTitle}</h1>
            <p className={styles.setBox}><span>Set <strong>{match.setNumber}</strong></span></p>
            <p className={`${styles.race} ${alert ? styles.raceAlert : ""}`}>
              {setFlash || banner}
            </p>
          </div>
          <div className={styles.scoreRow} aria-label="Current score">
            <span className={`${styles.score} ${styles.homeScore} ${homePop ? styles.scorePop : ""}`}>{match.homeScore}</span>
            <span className={styles.colon} aria-hidden="true" />
            <span className={`${styles.score} ${styles.awayScore} ${awayPop ? styles.scorePop : ""}`}>{match.awayScore}</span>
          </div>
          <div className={styles.controls}>
            <button
              className={styles.undo}
              type="button"
              disabled={!canUndo(engine)}
              onClick={() => dispatch({ type: "undo" })}
            >
              <UndoIcon className={styles.controlIcon} />
              Undo
            </button>
            <Button tone={over ? "primary" : "quiet"} onClick={requestNewMatch}>
              New Match
            </Button>
            {over ? (
              <Button type="button" tone="quiet" onClick={endMatch}>
                End Match
              </Button>
            ) : (
              <Button type="button" tone="gold" onClick={requestShare}>
                <ShareIcon className={styles.controlIcon} />
                {live.status === "error" ? "Retry Live" : "Share Live"}
              </Button>
            )}
          </div>
        </section>

        <section className={`${styles.team} ${styles.away}`}>
          <div className={styles.identity}>
            <LogoMark className={styles.teamLogo} name={match.awayName} logo={draft.awayLogo} color={match.awayColor} />
            <div>
              <span className={styles.teamName}>{match.awayName}</span>
              <span className={styles.sets}>Sets {match.awaySets}</span>
            </div>
          </div>
          <div className={styles.pointActions}>
            <button
              className={`${styles.point} ${styles.plus} ${styles.plusAway}`}
              type="button"
              disabled={over}
              aria-label={`Add point to ${match.awayName}`}
              onClick={() => score("away")}
            >
              +1
            </button>
            <button
              className={`${styles.point} ${styles.minus}`}
              type="button"
              disabled={over || match.awayScore <= 0}
              aria-label={`Subtract point from ${match.awayName}`}
              onClick={() => minus("away")}
            >
              −1
            </button>
          </div>
        </section>
      </main>

      {winnerOpen && match.winner ? (
        <div className={styles.winner} role="dialog" aria-labelledby="winner-title">
          <button className={styles.winnerShade} type="button" aria-label="Close winner overlay" onClick={closeWinner} />
          <div className={styles.winnerCard}>
            <p className={styles.winnerEyebrow}>Match won</p>
            <h2 className={styles.winnerName} id="winner-title">
              {match.winner === "home" ? match.homeName : match.awayName}
            </h2>
            <ul className={styles.setList}>
              {match.completedSets.map((set) => (
                <li key={set.set}>
                  <span>Set {set.set}</span>
                  <strong>{set.homeScore}–{set.awayScore}</strong>
                </li>
              ))}
            </ul>
            <div className={styles.winnerActions}>
              <Button type="button" tone="gold" onClick={openRecap}>
                Share Results
              </Button>
              <Button type="button" tone="quiet" onClick={endMatch}>
                End Match
              </Button>
              <Button tone="quiet" onClick={startNewMatch}>New Match</Button>
              <Button tone="quiet" disabled={!canUndo(engine)} onClick={() => dispatch({ type: "undo" })}>
                Undo last point
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        open={confirmOpen}
        title="Start a new match?"
        copy="This clears scores and sets. Team names and colors stay."
        confirmLabel="Start New Match"
        onConfirm={startNewMatch}
        onCancel={() => setConfirmOpen(false)}
      />
      <Dialog
        open={leaveOpen}
        title="Leave this live match?"
        copy="Keep the viewer link running, or end it for families on the link."
        onCancel={() => setLeaveOpen(false)}
        actions={
          <>
            <Button
              tone="gold"
              onClick={() => {
                setLeaveOpen(false);
                navigate("/");
              }}
            >
              Keep Live
            </Button>
            <Button
              tone="quiet"
              onClick={() => {
                void live.endLive().then(() => navigate("/"));
              }}
            >
              End Match
            </Button>
            <Button tone="quiet" onClick={() => setLeaveOpen(false)}>Stay</Button>
          </>
        }
      />
      <Dialog
        open={Boolean(live.error) && live.status === "error" && !live.shareOpen}
        title="Live share needs a moment"
        copy={live.error}
        confirmLabel="Try Again"
        onConfirm={() => void requestShare()}
        onCancel={() => useLiveSession.setState({ error: "" })}
      />
      <ShareSheet open={live.shareOpen} url={liveViewerUrl(live.gameId)} onClose={live.closeShare} />
      <ResultsSheet open={recapOpen} match={recapMatch} onClose={closeRecap} />
      <FanZone
        gameId={live.gameId}
        chatPaused={live.chatPaused}
        ended={!live.active}
        role="scorer"
        onToggleChat={live.active ? () => void live.setChatPaused(!live.chatPaused) : undefined}
      />
    </div>
  );
}
