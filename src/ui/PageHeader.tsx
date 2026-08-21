import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BackIcon } from "./icons";
import { withBase } from "../lib/base";
import styles from "./PageHeader.module.css";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  copy?: string;
  backTo?: string;
  backLabel?: string;
  action?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  copy,
  backTo = "/",
  backLabel = "Back",
  action
}: PageHeaderProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.topline}>
        <Link className={styles.back} to={backTo}>
          <BackIcon className={styles.backIcon} />
          {backLabel}
        </Link>
        <img className={styles.logo} src={withBase("scoreflow-logo.png")} alt="ScoreFlow" />
        {action ?? <span className={styles.spacer} />}
      </div>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        {copy ? <p>{copy}</p> : null}
      </div>
    </header>
  );
}
