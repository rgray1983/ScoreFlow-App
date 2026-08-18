import type { ReactNode } from "react";
import { PageHeader } from "../ui/PageHeader";
import styles from "./InnerScreen.module.css";

type InnerScreenProps = {
  eyebrow: string;
  title: string;
  copy: string;
  backTo?: string;
  children?: ReactNode;
};

export function InnerScreen({ eyebrow, title, copy, backTo, children }: InnerScreenProps) {
  return (
    <div className={styles.page}>
      <PageHeader eyebrow={eyebrow} title={title} copy={copy} backTo={backTo} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
