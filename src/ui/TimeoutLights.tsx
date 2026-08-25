import { TIMEOUTS_PER_SET } from "../scoring";
import styles from "./TimeoutLights.module.css";

type TimeoutLightsProps = {
  teamName: string;
  remaining: number;
  color: string;
  interactive?: boolean;
  disabled?: boolean;
  testId?: string;
  onCall?: () => void;
};

export function TimeoutLights({
  teamName,
  remaining,
  color,
  interactive = false,
  disabled = false,
  testId,
  onCall
}: TimeoutLightsProps) {
  const count = Math.max(0, Math.min(TIMEOUTS_PER_SET, remaining));
  const label = `${teamName} timeouts remaining: ${count}`;

  return (
    <div
      className={styles.row}
      style={{ ["--timeout-color" as string]: color }}
      role="group"
      aria-label={label}
      data-testid={testId}
    >
      <span className={styles.caption}>TO's:</span>
      {Array.from({ length: TIMEOUTS_PER_SET }, (_, index) => {
        const available = index < count;
        const className = `${styles.lamp} ${available ? styles.on : styles.off}`;
        if (interactive && available) {
          return (
            <button
              key={index}
              className={className}
              type="button"
              disabled={disabled}
              aria-label={`Call timeout for ${teamName}`}
              data-testid={testId ? `${testId}-call` : undefined}
              onClick={onCall}
            />
          );
        }
        return <span key={index} className={className} aria-hidden="true" />;
      })}
    </div>
  );
}
