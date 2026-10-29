import styles from "./LivePill.module.css";

type Status = "offline" | "connecting" | "pending" | "live" | "error";

const labels: Record<Status, string> = {
  offline: "Offline",
  connecting: "Connecting",
  pending: "Pending",
  live: "Online",
  error: "Sync Error"
};

export function LivePill({ status = "offline" }: { status?: Status }) {
  return (
    <span
      title={status === "pending" ? "Updates saved on this device; waiting for server acknowledgement" : undefined}
      className={`${styles.pill} ${status === "live" ? styles.live : ""} ${status === "connecting" || status === "pending" ? styles.connecting : ""} ${status === "error" ? styles.error : ""}`}
    >
      <span className={styles.dot} />
      {labels[status]}
    </span>
  );
}
