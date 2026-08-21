import type { FocusEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import styles from "./Field.module.css";

type FieldProps = {
  label: string;
  children: ReactNode;
};

export function selectInputText(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void {
  const field = event.currentTarget;
  window.requestAnimationFrame(() => field.select());
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className={styles.field}>
      {label}
      {children}
    </label>
  );
}

export function TextInput({ onFocus, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={styles.control}
      {...props}
      onFocus={(event) => {
        selectInputText(event);
        onFocus?.(event);
      }}
    />
  );
}

export function SelectInput({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${styles.control} ${styles.select} ${className}`} {...props} />;
}
