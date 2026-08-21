import { useEffect, useState } from "react";
import styles from "./LogoMark.module.css";

type LogoMarkProps = {
  name: string;
  logo?: string;
  color?: string;
  className?: string;
};

export function LogoMark({ name, logo, color, className = "" }: LogoMarkProps) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(logo) && !broken;
  const initial = (name || "T").charAt(0).toUpperCase();

  useEffect(() => {
    setBroken(false);
  }, [logo]);

  return (
    <span
      className={`${styles.mark} ${showImage ? styles.hasLogo : ""} ${className}`}
      style={color ? { background: color } : undefined}
    >
      {showImage ? (
        <img src={logo || ""} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      ) : (
        <span className={styles.initial}>{initial}</span>
      )}
    </span>
  );
}
