import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import styles from "./Dialog.module.css";

type DialogProps = {
  open: boolean;
  title: string;
  copy?: string;
  eyebrow?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "primary" | "gold" | "quiet";
  hideCancel?: boolean;
  variant?: "default" | "fan";
  onConfirm?: () => void;
  onCancel: () => void;
  children?: ReactNode;
  actions?: ReactNode;
};

export function Dialog({
  open,
  title,
  copy,
  eyebrow,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmTone = "primary",
  hideCancel = false,
  variant = "default",
  onConfirm,
  onCancel,
  children,
  actions
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) {
      try {
        node.showModal();
      } catch {
        node.setAttribute("open", "");
      }
    }
    return () => {
      if (node.open) node.close();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    const input = node?.querySelector<HTMLInputElement>("input, textarea, select");
    const timer = window.setTimeout(() => input?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className={`${styles.card} ${variant === "fan" ? styles.fan : ""}`} onClick={(event) => event.stopPropagation()}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h2 id="dialog-title">{title}</h2>
        {copy ? <p>{copy}</p> : null}
        {children}
        <div className={styles.actions}>
          {actions ?? (
            <>
              {onConfirm && confirmLabel ? <Button tone={confirmTone} onClick={onConfirm}>{confirmLabel}</Button> : null}
              {hideCancel ? null : <Button tone="quiet" onClick={onCancel}>{cancelLabel}</Button>}
            </>
          )}
        </div>
      </div>
    </dialog>,
    document.body
  );
}
