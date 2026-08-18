import { useParams } from "react-router-dom";
import { Button } from "../ui/Button";
import { LivePill } from "../ui/LivePill";
import styles from "./ViewerPage.module.css";

export function ViewerPage() {
  const { gameId } = useParams();

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <img className={styles.logo} src="/scoreflow-logo.png" alt="ScoreFlow" />
        <LivePill status="offline" />
      </header>
      <main className={styles.board}>
        <p className={styles.eyebrow}>Live viewer</p>
        <h1>Game Night</h1>
        <div className={styles.scoreRow}>
          <span>0</span>
          <b>:</b>
          <span>0</span>
        </div>
        <p className={styles.meta}>{gameId ? `Game ${gameId}` : "No live game yet."}</p>
      </main>
      <footer className={styles.footer}>
        <Button to="/" tone="quiet">ScoreFlow Home</Button>
      </footer>
    </div>
  );
}
