import { useToast } from "../state/toast";
import styles from "./Toast.module.css";

export function ToastHost() {
  const message = useToast((state) => state.message);
  const hot = useToast((state) => state.hot);
  const visible = useToast((state) => state.visible);
  if (!message) return null;
  return (
    <div className={`${styles.toast} ${hot ? styles.hot : ""} ${visible ? styles.show : ""}`} role="status">
      {message}
    </div>
  );
}
