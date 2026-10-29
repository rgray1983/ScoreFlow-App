import { BoardSound } from "../ui/BoardSound";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  canUndo,
  isMatchOver,
  isServing,
  matchBanner,
  timeoutsOf,
  type HighlightKind,
  type Side
} from "../scoring";
import { matchPlays } from "../scoring/plays";
import { RosterDrawer } from "../ui/RosterDrawer";
import { matchHasProgress } from "../storage/matchEngine";
import { historyMatchFromLive } from "../storage/matchHistory";
import { consumeResumeIntent, isDocumentReload, shouldResumeLiveOnMatchPage } from "../state/homeResume";
import { usePremium } from "../state/premium";
import { useAccount } from "../state/account";
import { useWorkspace } from "../state/workspace";
import { liveViewerUrl, useLiveSession } from "../state/liveSession";
import { BoardLogoPicker } from "../ui/BoardLogoPicker";
import { BoardStylePicker, HighlightBurst, HighlightPicker, RunBadge, ScorerCredit, ScoreDigits } from "../ui/BoardAddons";
import { SetBreakCard } from "../ui/SetBreakCard";
import { boardEnergyAttributes } from "../ui/boardEnergy";
import { Button } from "../ui/Button";
import { ConfettiBurst } from "../ui/ConfettiBurst";
import { Dialog } from "../ui/Dialog";
import { FanZone } from "../ui/FanZone";
import { TeamName } from "../ui/TeamName";
import { MatchWonCard, WinnerCelebration } from "../ui/MatchWon";
import { ResultsSheet } from "../ui/ResultsSheet";
import { BoardFxBanners } from "../ui/BoardFxBanners";
import { SetHistoryTicker } from "../ui/SetHistoryTicker";
import { ShareSheet } from "../ui/ShareSheet";
import { HomeIcon, SettingsIcon, ShareIcon, UndoIcon } from "../ui/icons";
import { LivePill } from "../ui/LivePill";
import { ServingMark } from "../ui/ServingMark";
import { TimeoutLights } from "../ui/TimeoutLights";
import { TimeoutOverlay, useTimeoutRemaining } from "../ui/TimeoutOverlay";
import { useBoardFx } from "../ui/useBoardFx";
import { withBase } from "../lib/base";
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
  const draft = useWorkspace((state) => state.matchDraft);
  const engine = useWorkspace((state) => state.engine);
  const dispatch = useWorkspace((state) => state.dispatch);
  const updateDraft = useWorkspace((state) => state.updateMatchDraft);
  const roster = useWorkspace((state) => state.matchRoster);
  const isPro = usePremium((state) => state.isPro);
  const plays = useMemo(() => matchPlays(engine), [engine]);
  const resultBackground = usePremium((state) => state.resultBackground);
  const scorerName = useAccount((state) => state.displayName);
  const live = useLiveSession();
  const match = engine.match;
  const over = isMatchOver(match);
  const scoringBlocked = over || match.pendingSet;
  const banner = matchBanner(match);
  const alert = banner.startsWith("SET POINT") || banner.startsWith("MATCH POINT") || banner.startsWith("MATCH WON");
  const homePop = useScorePop(match.homeScore);
  const awayPop = useScorePop(match.awayScore);
  const fx = useBoardFx(match);
  const timeoutActive = Boolean(match.activeTimeout);
  const timeoutRemaining = useTimeoutRemaining(match.timeoutEndsAtMs, timeoutActive);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [winnerOpen, setWinnerOpen] = useState(Boolean(match.winner));
  const [matchCardOpen, setMatchCardOpen] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [callSide, setCallSide] = useState<Side | null>(null);

  useEffect(() => {
    if (match.winner) {
      setWinnerOpen(true);
      setMatchCardOpen(false);
      return;
    }
    setWinnerOpen(false);
    setMatchCardOpen(false);
  }, [match.winner]);

  useEffect(() => {
    if (!timeoutActive || timeoutRemaining > 0) return;
    dispatch({ type: "endTimeout" });
  }, [dispatch, timeoutActive, timeoutRemaining]);

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

  function setTeamLogo(side: Side, logo: string) {
    updateDraft(side === "home" ? { homeLogo: logo } : { awayLogo: logo });
    live.publishBranding(match, useWorkspace.getState().matchDraft);
  }

  function score(side: Side) {
    dispatch({ type: "point", side });
    vibrate();
  }

  function vibrate() {
    if (!scoringBlocked) navigator.vibrate?.(16);
  }

  function highlight(side: Side, kind: HighlightKind) {
    dispatch({ type: "highlight", call: { id: crypto.randomUUID(), kind, side, atMs: Date.now() } });
    setCallSide(null);
    vibrate();
  }

  function minus(side: Side) {
    dispatch({ type: "subtract", side });
  }

  function serve(side: Side) {
    dispatch({ type: "setServe", side });
  }

  function callTimeout(side: Side) {
    dispatch({ type: "timeout", side });
  }

  function startNewMatch() {
    dispatch({ type: "newMatch" });
    setConfirmOpen(false);
    setWinnerOpen(false);
    setMatchCardOpen(false);
    setRecapOpen(false);
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

  function showResults() {
    setWinnerOpen(false);
    setMatchCardOpen(true);
  }

  function openRecap() {
    setRecapOpen(true);
  }

  function closeRecap() {
    setRecapOpen(false);
    if (match.winner) setMatchCardOpen(true);
  }

  function endMatch() {
    void live.endLive().finally(() => navigate("/"));
  }

  const recapMatch = historyMatchFromLive({
    match,
    homeLogo: draft.homeLogo,
    awayLogo: draft.awayLogo,
    resultBackground
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
          <button className={styles.iconButton} type="button" aria-label="Board style" onClick={() => setStyleOpen(true)}>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="3" /><path d="M12 4v16M3 12h18" />
            </svg>
          </button>
        </div>
        <img className={styles.logo} src={withBase("scoreflow-logo.png")} alt="ScoreFlow" />
        <div className={styles.status}>
          <BoardSound match={match} active session={live.gameId || "local"} className={styles.iconButton} />
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
        <SetHistoryTicker match={match} />
      </header>

      <main className={styles.board} {...boardEnergyAttributes(match)} aria-label="Volleyball scoreboard">
        <section className={`${styles.team} ${styles.home}`}>
          <div className={styles.identity}>
            <div className={styles.logoStack}>
              <BoardLogoPicker
                name={match.homeName}
                logo={draft.homeLogo}
                color={match.homeColor}
                label={`Upload ${match.homeName} logo`}
                wrapClassName={styles.logoPick}
                markClassName={styles.teamLogo}
                onChange={(logo) => setTeamLogo("home", logo)}
              />
              <ServingMark
                teamName={match.homeName}
                active={isServing(match, "home")}
                interactive
                disabled={scoringBlocked}
                testId="serving-home"
                onSelect={() => serve("home")}
              />
            </div>
            <div className={styles.meta}>
              <TeamName className={styles.teamName} name={match.homeName} />
              <span className={styles.sets}>Sets {match.homeSets}</span>
              <TimeoutLights
                teamName={match.homeName}
                remaining={timeoutsOf(match, "home")}
                color={match.homeColor}
                interactive
                disabled={scoringBlocked || timeoutActive}
                testId="timeouts-home"
                onCall={() => callTimeout("home")}
              />
              <RunBadge match={match} side="home" />
            </div>
          </div>
          <div className={styles.pointActions}>
            <button
              className={`${styles.point} ${styles.plus}`}
              type="button"
              disabled={scoringBlocked}
              aria-label={`Add point to ${match.homeName}`}
              onClick={() => score("home")}
            >
              +1
            </button>
            <button
              className={`${styles.point} ${styles.minus}`}
              type="button"
              disabled={scoringBlocked || match.homeScore <= 0}
              aria-label={`Subtract point from ${match.homeName}`}
              onClick={() => minus("home")}
            >
              −1
            </button>
            <button className={`${styles.point} ${styles.call}`} type="button" disabled={scoringBlocked}
              aria-label={`Highlight call for ${match.homeName}`} onClick={() => setCallSide("home")}>Call</button>
          </div>
        </section>

        <section className={styles.center}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>{match.matchTitle}</h1>
            <ScorerCredit name={scorerName} />
            <p className={styles.setBox}><span>Set <strong>{match.setNumber}</strong></span></p>
            <p className={`${styles.race} ${alert ? styles.raceAlert : ""}`}>
              {banner}
            </p>
            <BoardFxBanners
              match={match}
              pointSide={fx.pointSide}
              pointKey={fx.pointKey}
              setWinnerSide={fx.setWinnerSide}
              setWinnerKey={fx.setWinnerKey}
            />
          </div>
          <div className={styles.scoreRow} aria-label="Current score">
            <span className={`${styles.score} ${styles.homeScore} ${homePop ? styles.scorePop : ""}`} data-testid="home-score"><ScoreDigits value={match.homeScore} theme={match.boardTheme} /></span>
            <span className={styles.colon} aria-hidden="true" />
            <span className={`${styles.score} ${styles.awayScore} ${awayPop ? styles.scorePop : ""}`} data-testid="away-score"><ScoreDigits value={match.awayScore} theme={match.boardTheme} /></span>
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
            <div className={styles.logoStack}>
              <BoardLogoPicker
                name={match.awayName}
                logo={draft.awayLogo}
                color={match.awayColor}
                label={`Upload ${match.awayName} logo`}
                wrapClassName={styles.logoPick}
                markClassName={styles.teamLogo}
                onChange={(logo) => setTeamLogo("away", logo)}
              />
              <ServingMark
                teamName={match.awayName}
                active={isServing(match, "away")}
                interactive
                disabled={scoringBlocked}
                testId="serving-away"
                onSelect={() => serve("away")}
              />
            </div>
            <div className={styles.meta}>
              <TeamName className={styles.teamName} name={match.awayName} />
              <span className={styles.sets}>Sets {match.awaySets}</span>
              <TimeoutLights
                teamName={match.awayName}
                remaining={timeoutsOf(match, "away")}
                color={match.awayColor}
                interactive
                disabled={scoringBlocked || timeoutActive}
                testId="timeouts-away"
                onCall={() => callTimeout("away")}
              />
              <RunBadge match={match} side="away" />
            </div>
          </div>
          <div className={styles.pointActions}>
            <button
              className={`${styles.point} ${styles.plus} ${styles.plusAway}`}
              type="button"
              disabled={scoringBlocked}
              aria-label={`Add point to ${match.awayName}`}
              onClick={() => score("away")}
            >
              +1
            </button>
            <button
              className={`${styles.point} ${styles.minus}`}
              type="button"
              disabled={scoringBlocked || match.awayScore <= 0}
              aria-label={`Subtract point from ${match.awayName}`}
              onClick={() => minus("away")}
            >
              −1
            </button>
            <button className={`${styles.point} ${styles.call}`} type="button" disabled={scoringBlocked}
              aria-label={`Highlight call for ${match.awayName}`} onClick={() => setCallSide("away")}>Call</button>
          </div>
        </section>
      </main>

      {isPro && roster.length > 0 ? <RosterDrawer roster={roster} disabled={scoringBlocked} onCall={(player, kind) => {
        dispatch({ type: "highlight", call: { id: crypto.randomUUID(), side: "home", kind, atMs: Date.now(), player: { ...player } } });
        vibrate();
      }} /> : null}
      <HighlightBurst match={match} />
      <SetBreakCard match={match} onContinue={() => dispatch({ type: "continueSet" })} onUndo={() => dispatch({ type: "undo" })} />
      <BoardStylePicker open={styleOpen} theme={match.boardTheme} onClose={() => setStyleOpen(false)}
        onSelect={(theme) => dispatch({ type: "setBoardTheme", theme })} />
      <HighlightPicker side={callSide} match={match} onCall={highlight} onClose={() => setCallSide(null)} />

      <TimeoutOverlay
        match={match}
        remainingMs={timeoutRemaining}
        compact
        onEnd={() => dispatch({ type: "endTimeout" })}
      />

      <ConfettiBurst
        active={fx.confetti}
        colors={[match.homeColor, match.awayColor, "#ffd166", "#ffffff", "#ff3b30"]}
      />

      {winnerOpen && match.winner && !matchCardOpen && !recapOpen ? (
        <WinnerCelebration
          name={match.winner === "home" ? match.homeName : match.awayName}
          colors={[match.homeColor, match.awayColor, "#ffd166", "#ffffff", "#ff3b30"]}
          onShowResults={showResults}
        />
      ) : null}

      {matchCardOpen && match.winner ? (
        <div className={styles.winner} role="dialog" aria-labelledby="winner-title">
          <button className={styles.winnerShade} type="button" aria-hidden="true" tabIndex={-1} />
          <MatchWonCard match={match}>
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
          </MatchWonCard>
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
        plays={plays}
        gameId={live.gameId}
        chatPaused={live.chatPaused}
        ended={!live.active}
        role="scorer"
        onToggleChat={live.active ? () => void live.setChatPaused(!live.chatPaused) : undefined}
      />
    </div>
  );
}
