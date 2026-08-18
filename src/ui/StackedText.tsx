import type { ReactNode } from "react";
import styles from "./StackedText.module.css";

type StackedTextProps = {
  title: ReactNode;
  copy: ReactNode;
  className?: string;
};

export function StackedText({ title, copy, className = "" }: StackedTextProps) {
  return (
    <span className={`${styles.stack} ${className}`.trim()}>
      <strong>{title}</strong>
      <small>{copy}</small>
    </span>
  );
}
