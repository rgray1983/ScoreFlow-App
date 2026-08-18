import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  canUndo,
  isMatchOver,
  matchBanner,
  type Side
} from "../scoring";
import { matchFormatLabel } from "../storage/matchSetup";
import { matchHasProgress } from "../storage/matchEngine";
import { useWorkspace } from "../state/workspace";
import { liveViewerUrl, useLiveSession } from "../state/liveSession";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { ShareSheet } from "../ui/ShareSheet";
import { HomeIcon, ShareIcon, UndoIcon } from "../ui/icons";
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
    if (live.recovery?.gameId && live.status !== "live") {
      void live.resumeLive(match, draft);
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
    if (live.status === "live" || live.gameId) {
      setLeaveOpen(true);
      return;
    }
    navigate("/");
  }

  async function requestShare() {
    if (live.status === "live" && live.gameId) {
      live.openShare();
      return;
    }
    await live.goLive(match, draft);
  }

  return (
    <div
      className={styles.page}
      style={{ ["--home" as string]: match.homeColor, ["--away" as string]: match.awayColor }}
    >
      <header className={styles.topBar}>
        <div className={styles.left}>
          <button className={styles.iconButton} type="button" aria-label="Home" onClick={requestHome}>
            <HomeIcon className={styles.icon} />
          </button>
          <Link className={styles.setupLink} to="/setup">Setup</Link>
        </div>
        <img className={styles.logo} src="/scoreflow-logo.png" alt="ScoreFlow" />
        <div className={styles.status}>
          <span className={styles.viewers}>Viewers {live.viewerCount}</span>
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
          <span className={styles.pill}>{matchFormatLabel(match.matchFormat)}</span>
          <h1 className={styles.title}>{match.matchTitle}</h1>
          <p className={styles.setLabel}>SET {match.setNumber}</p>
          <p className={`${styles.race} ${alert ? styles.raceAlert : ""}`}>
            {setFlash || banner}
          </p>
          <div className={styles.scoreRow} aria-label="Current score">
            <span className={`${styles.score} ${styles.homeScore} ${homePop ? styles.scorePop : ""}`}>{match.homeScore}</span>
            <span className={styles.colon} aria-hidden="true">:</span>
            <span className={`${styles.score} ${styles.awayScore} ${awayPop ? styles.scorePop : ""}`}>{match.awayScore}</span>
          </div>
          <button
            className={`${styles.point} ${styles.undo}`}
            type="button"
            disabled={!canUndo(engine)}
            onClick={() => dispatch({ type: "undo" })}
          >
            <UndoIcon className={styles.controlIcon} />
            Undo
          </button>
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

      <footer className={styles.footer}>
        <Button tone={over ? "primary" : "quiet"} onClick={requestNewMatch}>
          New Match
        </Button>
        <Button tone="gold" onClick={() => void requestShare()}>
          <ShareIcon className={styles.controlIcon} />
          {live.status === "error" ? "Retry Live" : "Share Live"}
        </Button>
      </footer>

      {winnerOpen && match.winner ? (
        <div className={styles.winner} role="dialog" aria-labelledby="winner-title">
          <button className={styles.winnerShade} type="button" aria-label="Close winner overlay" onClick={() => setWinnerOpen(false)} />
          <div className={styles.winnerCard}>
            <p className={styles.winnerEyebrow}>Match won</p>
            <h2 id="winner-title">{match.winner === "home" ? match.homeName : match.awayName}</h2>
            <ul className={styles.setList}>
              {match.completedSets.map((set) => (
                <li key={set.set}>
                  <span>Set {set.set}</span>
                  <strong>{set.homeScore}–{set.awayScore}</strong>
                </li>
              ))}
            </ul>
            <div className={styles.winnerActions}>
              <Button tone="gold" onClick={() => void requestShare()}>
                <ShareIcon className={styles.controlIcon} />
                Share Live
              </Button>
              <Button onClick={startNewMatch}>New Match</Button>
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
    </div>
  );
}
