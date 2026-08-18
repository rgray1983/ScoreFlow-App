import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { HomeIcon, ShareIcon, UndoIcon } from "../ui/icons";
import { LivePill } from "../ui/LivePill";
import styles from "./MatchPage.module.css";

export function MatchPage() {
  return (
    <div className={styles.page}>
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
          <span className={styles.teamName}>Team 1</span>
          <span className={styles.sets}>Sets 0</span>
        </section>

        <section className={styles.center}>
          <span className={styles.pill}>Club · Best 2 of 3</span>
          <h1 className={styles.title}>Game Night</h1>
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
          <span className={styles.teamName}>Team 2</span>
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
