import { VolleyballIcon } from "./icons";
import styles from "./ServingMark.module.css";

type ServingMarkProps = {
  teamName: string;
  active: boolean;
  interactive?: boolean;
  disabled?: boolean;
  testId?: string;
  onSelect?: () => void;
};

export function ServingMark({
  teamName,
  active,
  interactive = false,
  disabled = false,
  testId,
  onSelect
}: ServingMarkProps) {
  const label = active ? `${teamName} is serving` : `Set ${teamName} as serving`;
  const className = `${styles.mark} ${active ? styles.active : styles.idle}`;
  const body = (
    <>
      <VolleyballIcon className={styles.ball} />
      {active ? <span className={styles.pill}>Serving</span> : interactive ? <span className={styles.hint}>Serve</span> : null}
    </>
  );

  if (interactive) {
    return (
      <button
        className={className}
        type="button"
        data-testid={testId}
        aria-pressed={active}
        aria-label={label}
        disabled={disabled}
        onClick={onSelect}
      >
        {body}
      </button>
    );
  }

  if (!active) {
    return <div className={`${styles.mark} ${styles.spacer}`} aria-hidden="true" />;
  }

  return (
    <div className={className} data-testid={testId} aria-label={label}>
      {body}
    </div>
  );
}
