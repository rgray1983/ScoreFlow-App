import type { ReactNode } from "react";
import { Button } from "./Button";
import styles from "./Dialog.module.css";

type DialogProps = {
  open: boolean;
  title: string;
  copy?: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: "primary" | "quiet";
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

export function Dialog({
  open,
  title,
  copy,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmTone = "primary",
  onConfirm,
  onCancel,
  children
}: DialogProps) {
  if (!open) return null;
  return (
    <div className={styles.shade} role="presentation" onClick={onCancel}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title">{title}</h2>
        {copy ? <p>{copy}</p> : null}
        {children}
        <div className={styles.actions}>
          <Button tone={confirmTone} onClick={onConfirm}>{confirmLabel}</Button>
          <Button tone="quiet" onClick={onCancel}>{cancelLabel}</Button>
        </div>
      </div>
    </div>
  );
}
