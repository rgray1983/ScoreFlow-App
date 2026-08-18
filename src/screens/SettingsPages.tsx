import { Link } from "react-router-dom";
import { InnerScreen } from "./InnerScreen";
import { ChevronIcon } from "../ui/icons";
import styles from "./InnerScreen.module.css";

export function SettingsPage() {
  return (
    <InnerScreen
      eyebrow="Settings"
      title="Your ScoreFlow. Your Way."
      copy="Control the look and backups that make ScoreFlow feel like your team's app."
    >
      <Link className={`${styles.card} ${styles.navCard}`} to="/settings/themes">
        <span>
          <strong>Themes</strong>
          <small>Choose the app's visual style.</small>
        </span>
        <ChevronIcon className={styles.chevron} />
      </Link>
      <Link className={`${styles.card} ${styles.navCard}`} to="/settings/graphics">
        <span>
          <strong>Background Graphics</strong>
          <small>Match Results and social share backgrounds.</small>
        </span>
        <ChevronIcon className={styles.chevron} />
      </Link>
    </InnerScreen>
  );
}

export function SettingsThemesPage() {
  return (
    <InnerScreen
      eyebrow="Themes"
      title="Choose Your Look."
      copy="Classic stays free. Premium themes wait for a later phase."
      backTo="/settings"
    >
      <section className={styles.card}>
        <h2>Classic</h2>
        <p>The gym-readable ScoreFlow board. Other themes are not wired yet.</p>
      </section>
    </InnerScreen>
  );
}

export function SettingsGraphicsPage() {
  return (
    <InnerScreen
      eyebrow="Background Graphics"
      title="Results That Pop."
      copy="Result backgrounds will be picked here after history graphics land."
      backTo="/settings"
    >
      <section className={styles.card}>
        <h2>Default</h2>
        <p>The current free graphic. More backgrounds come with results sharing.</p>
      </section>
    </InnerScreen>
  );
}
