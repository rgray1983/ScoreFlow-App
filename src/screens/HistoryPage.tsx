import { InnerScreen } from "./InnerScreen";
import styles from "./InnerScreen.module.css";

export function HistoryPage() {
  return (
    <InnerScreen
      eyebrow="Match History"
      title="Your Matches. Your Flow."
      copy="Saved results will live here. Nothing is stored in this shell yet."
    >
      <p className={styles.note}>Completed matches will show up here.</p>
    </InnerScreen>
  );
}
