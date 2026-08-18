import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { ChevronIcon, SettingsIcon } from "../ui/icons";
import { LogoMark } from "../ui/LogoMark";
import { StackedText } from "../ui/StackedText";
import { useLiveSession } from "../state/liveSession";
import { useWorkspace } from "../state/workspace";
import styles from "./HomePage.module.css";

export function HomePage() {
  const navigate = useNavigate();
  const homeTeam = useWorkspace((state) => state.homeTeam);
  const recovery = useLiveSession((state) => state.recovery);
  const endLive = useLiveSession((state) => state.endLive);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.topline}>
          <img className={styles.logo} src="/scoreflow-logo.png" alt="ScoreFlow" />
          <div className={styles.actions}>
            <span className={styles.chip}>Scorer</span>
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
        <div className={styles.primaryAction}>
          <Button to="/setup">Start a Match</Button>
        </div>
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
        open={Boolean(recovery)}
        title="Live match still open"
        copy={recovery?.summary || "A live viewer link is still running from this phone."}
        onCancel={() => undefined}
        actions={
          <>
            <Button tone="gold" onClick={() => navigate("/match")}>Resume Match</Button>
            <Button tone="quiet" onClick={() => void endLive()}>End Match</Button>
          </>
        }
      />
    </div>
  );
}
