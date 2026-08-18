import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { ChevronIcon, SettingsIcon } from "../ui/icons";
import styles from "./HomePage.module.css";

export function HomePage() {
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
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Home Team</h2>
            <small>Default team</small>
          </div>
          <p className={styles.muted}>Team setup arrives in the next phase. Start a match to walk the new screens.</p>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Match History</h2>
            <Link className={styles.textLink} to="/history">Show more</Link>
          </div>
          <p className={styles.empty}>Completed matches will show up here.</p>
        </section>

        <Link className={`${styles.card} ${styles.navCard}`} to="/settings">
          <span>
            <strong>Settings</strong>
            <small>Themes, graphics, and backup.</small>
          </span>
          <ChevronIcon className={styles.chevron} />
        </Link>
      </main>
    </div>
  );
}
