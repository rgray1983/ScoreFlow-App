import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { HomeIcon, ShareIcon, UndoIcon } from "../ui/icons";
import { LivePill } from "../ui/LivePill";
import { LogoMark } from "../ui/LogoMark";
import { matchFormatLabel } from "../storage/matchSetup";
import { useWorkspace } from "../state/workspace";
import styles from "./MatchPage.module.css";

export function MatchPage() {
  const draft = useWorkspace((state) => state.draft);

  return (
    <div
      className={styles.page}
      style={{ ["--home" as string]: draft.homeColor, ["--away" as string]: draft.awayColor }}
    >
      <header className={styles.topBar}>
        <div className={styles.left}>
          <Link className={styles.iconButton} to="/" aria-label="Home">
            <HomeIcon className={styles.icon} />
          </Link>
        </div>
        <img className={styles.logo} src="/scoreflow-logo.png" alt="ScoreFlow" />
        <div className={styles.status}>
          <span className={styles.viewers}>Viewers 0</span>
          <LivePill status="offline" />
        </div>
      </header>

      <main className={styles.board} aria-label="Volleyball scoreboard">
        <section className={`${styles.team} ${styles.home}`}>
          <LogoMark className={styles.teamLogo} name={draft.homeName} logo={draft.homeLogo} color={draft.homeColor} />
          <span className={styles.teamName}>{draft.homeName}</span>
          <span className={styles.sets}>Sets 0</span>
        </section>

        <section className={styles.center}>
          <span className={styles.pill}>{matchFormatLabel(draft.format)}</span>
          <h1 className={styles.title}>{draft.title}</h1>
          <p className={styles.setLabel}>SET 1</p>
          <p className={styles.race}>FIRST TO 25</p>
          <div className={styles.scoreRow} aria-label="Current score">
            <span className={`${styles.score} ${styles.homeScore}`}>0</span>
            <span className={styles.colon} aria-hidden="true">:</span>
            <span className={`${styles.score} ${styles.awayScore}`}>0</span>
          </div>
          <div className={styles.controls}>
            <button className={`${styles.point} ${styles.plus}`} type="button" disabled>+1</button>
            <button className={`${styles.point} ${styles.undo}`} type="button" disabled>
              <UndoIcon className={styles.controlIcon} />
              Undo
            </button>
            <button className={`${styles.point} ${styles.plusAway}`} type="button" disabled>+1</button>
          </div>
        </section>

        <section className={`${styles.team} ${styles.away}`}>
          <LogoMark className={styles.teamLogo} name={draft.awayName} logo={draft.awayLogo} color={draft.awayColor} />
          <span className={styles.teamName}>{draft.awayName}</span>
          <span className={styles.sets}>Sets 0</span>
        </section>
      </main>

      <footer className={styles.footer}>
        <Button to="/setup" tone="quiet">Match Setup</Button>
        <Button tone="gold" disabled>
          <ShareIcon className={styles.controlIcon} />
          Share Live
        </Button>
      </footer>
    </div>
  );
}
