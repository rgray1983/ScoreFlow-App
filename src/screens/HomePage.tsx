import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { ChevronIcon, SettingsIcon } from "../ui/icons";
import { LogoMark } from "../ui/LogoMark";
import { StackedText } from "../ui/StackedText";
import { shouldPromptLiveReturn, shouldShowResumeMatch, markResumeIntent } from "../state/homeResume";
import { useLiveSession } from "../state/liveSession";
import { useWorkspace } from "../state/workspace";
import { matchHasProgress } from "../storage/matchEngine";
import styles from "./HomePage.module.css";

export function HomePage() {
  const navigate = useNavigate();
  const homeTeam = useWorkspace((state) => state.homeTeam);
  const engine = useWorkspace((state) => state.engine);
  const match = engine.match;
  const liveActive = useLiveSession((state) => state.active);
  const recovery = useLiveSession((state) => state.recovery);
  const returnPrompt = useLiveSession((state) => state.returnPrompt);
  const endLive = useLiveSession((state) => state.endLive);
  const offerReturnPrompt = useLiveSession((state) => state.offerReturnPrompt);
  const dismissReturnPrompt = useLiveSession((state) => state.dismissReturnPrompt);
  const showResume = shouldShowResumeMatch({
    liveActive,
    hasRecovery: Boolean(recovery),
    matchHasProgress: matchHasProgress(engine)
  });
  const promptOpen = shouldPromptLiveReturn({
    liveActive,
    hasRecovery: Boolean(recovery),
    returnedToApp: returnPrompt
  });

  useEffect(() => {
    let leftApp = document.visibilityState === "hidden";
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        leftApp = true;
        return;
      }
      if (leftApp) offerReturnPrompt();
      leftApp = false;
    }
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) offerReturnPrompt();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [offerReturnPrompt]);

  function resumeMatch() {
    dismissReturnPrompt();
    markResumeIntent();
    navigate("/match");
  }

  const resumeHint = recovery?.summary
    || `${match.homeName} vs ${match.awayName} · Set ${match.setNumber}`;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.topline}>
          <img className={styles.logo} src="/scoreflow-logo.png" alt="ScoreFlow" />
          <div className={styles.actions}>
            <span className={liveActive ? `${styles.chip} ${styles.liveChip}` : styles.chip}>
              {liveActive ? "Live" : "Scorer"}
            </span>
            <Link className={styles.iconButton} to="/settings" aria-label="Settings">
              <SettingsIcon className={styles.icon} />
            </Link>
          </div>
        </div>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>Volleyball scoreboard</span>
          <h1>Score faster. Share instantly.</h1>
          <p>Set your home team once. Start scoring in seconds.</p>
        </div>
        <div className={`${styles.primaryAction} ${showResume ? styles.withResume : ""}`}>
          <Button to="/setup">Start a Match</Button>
          {showResume ? (
            <Button tone="gold" onClick={resumeMatch}>Resume Match</Button>
          ) : null}
        </div>
        {showResume ? <p className={styles.resumeHint}>{resumeHint}</p> : null}
      </header>

      <main className={styles.dashboard}>
        <section
          className={`${styles.card} ${homeTeam ? styles.homeTeamCard : ""}`}
          style={homeTeam ? { ["--home-team-card-color" as string]: homeTeam.color } : undefined}
        >
          <div className={styles.cardHead}>
            <h2>Home Team</h2>
            <small>Default team</small>
          </div>
          <div className={styles.teamRow}>
            <LogoMark name={homeTeam?.name || "T"} logo={homeTeam?.logo} color={homeTeam?.color} />
            <div className={styles.teamMeta}>
              <strong>{homeTeam?.name || "Set up your team"}</strong>
              <span>{homeTeam?.location || "Team name, city/state, logo, and color"}</span>
            </div>
          </div>
          <p className={styles.muted}>
            {homeTeam
              ? "Your home team is saved on this device."
              : "Set up your team once, then only enter the opponent when you start a match."}
          </p>
          <div className={styles.teamAction}>
            <Button to="/team" tone="quiet">{homeTeam ? "Edit Home Team" : "Setup Your Home Team"}</Button>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Match History</h2>
            <Link className={styles.textLink} to="/history">Show more</Link>
          </div>
          <p className={styles.empty}>Completed matches will show up here.</p>
        </section>

        <Link className={`${styles.card} ${styles.navCard}`} to="/settings">
          <StackedText title="Settings" copy="Themes, graphics, and backup." />
          <ChevronIcon className={styles.chevron} />
        </Link>
      </main>
      <Dialog
        open={promptOpen}
        title="Live match still open"
        copy={recovery?.summary || "A live viewer link is still running from this phone."}
        onCancel={dismissReturnPrompt}
        actions={
          <>
            <Button tone="gold" onClick={resumeMatch}>Resume Match</Button>
            <Button tone="quiet" onClick={() => void endLive()}>End Match</Button>
            <Button tone="quiet" onClick={dismissReturnPrompt}>Stay</Button>
          </>
        }
      />
    </div>
  );
}
