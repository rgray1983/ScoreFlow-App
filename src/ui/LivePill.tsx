import styles from "./LivePill.module.css";

type Status = "offline" | "connecting" | "live" | "error";

const labels: Record<Status, string> = {
  offline: "OFF",
  connecting: "WAIT",
  live: "LIVE",
  error: "ERR"
};

export function LivePill({ status = "offline" }: { status?: Status }) {
  return (
    <span
      className={`${styles.pill} ${status === "live" ? styles.live : ""} ${status === "connecting" ? styles.connecting : ""} ${status === "error" ? styles.error : ""}`}
    >
      <span className={styles.dot} />
      {labels[status]}
    </span>
  );
}
