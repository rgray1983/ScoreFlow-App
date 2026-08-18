import { Button } from "../ui/Button";
import { InnerScreen } from "./InnerScreen";
import styles from "./InnerScreen.module.css";

export function SetupPage() {
  return (
    <InnerScreen
      eyebrow="Match Setup"
      title="Your Match. Your Way."
      copy="Match details land in the next phase. You can still open the new scoreboard shell from here."
    >
      <section className={styles.card}>
        <h2>Teams</h2>
        <p>Home and visitor names, colors, and format will be edited here.</p>
      </section>
      <div className={styles.actions}>
        <Button to="/match">Open Scoreboard</Button>
        <Button to="/" tone="quiet">Back Home</Button>
      </div>
    </InnerScreen>
  );
}
