import { useEffect, useRef } from "react";
import { usePremium } from "../state/premium";
import { Button } from "./Button";
import styles from "./ProCard.module.css";

type ProCardProps = {
  variant?: "home" | "settings";
};

export function ProCard({ variant = "home" }: ProCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const isPro = usePremium((state) => state.isPro);
  const highlightPro = usePremium((state) => state.highlightPro);
  const togglePro = usePremium((state) => state.togglePro);
  const clearProFocus = usePremium((state) => state.clearProFocus);

  useEffect(() => {
    if (!highlightPro || variant !== "settings") return;
    const card = cardRef.current;
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
    const clear = window.setTimeout(() => clearProFocus(), 3400);
    return () => window.clearTimeout(clear);
  }, [highlightPro, variant, clearProFocus]);

  const home = variant === "home";
  const badge = isPro ? (home ? "Pro" : "ScoreFlow Pro") : "Free";
  const summary = isPro
    ? home
      ? "Pro is active: premium themes, graphics, unlimited history, and cloud backup are unlocked."
      : "Premium themes, poster styles, unlimited match history, and cloud backup are active."
    : home
      ? "Unlock premium themes, graphics, unlimited history, and cloud backup."
      : "Free includes live scoring, sharing, QR codes, and your latest 3 matches.";
  const buttonLabel = isPro
    ? home ? "Manage Pro" : "Pro Active"
    : "Try Pro";

  return (
    <section
      ref={cardRef}
      className={`${styles.card} ${highlightPro && variant === "settings" ? styles.attention : ""}`}
    >
      <div className={styles.head}>
        <div className={styles.lockup}>
          <span className={styles.mark} aria-hidden="true">★</span>
          <div>
            <span className={styles.kicker}>Premium preview</span>
            <h2>ScoreFlow Pro</h2>
          </div>
        </div>
        <small>{badge}</small>
      </div>
      <p className={styles.summary}>{summary}</p>
      <p className={styles.previewNote}>Preview only — not billed yet.</p>
      <div className={styles.actions}>
        <Button tone="gold" onClick={togglePro}>{buttonLabel}</Button>
      </div>
    </section>
  );
}
