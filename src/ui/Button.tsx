import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./Button.module.css";

type Tone = "primary" | "gold" | "quiet";

type Common = {
  tone?: Tone;
  className?: string;
  children: ReactNode;
};

export function Button({
  tone = "primary",
  className = "",
  children,
  to,
  ...props
}: Common & ButtonHTMLAttributes<HTMLButtonElement> & { to?: string }) {
  const classNames = `${styles.button} ${styles[tone]} ${className}`.trim();
  if (to) {
    return <Link className={classNames} to={to}>{children}</Link>;
  }
  return (
    <button className={classNames} type={props.type ?? "button"} {...props}>
      {children}
    </button>
  );
}
