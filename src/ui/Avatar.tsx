import { useEffect, useState } from "react";
import { PersonIcon } from "./icons";
import styles from "./Avatar.module.css";

type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  name?: string;
  photo?: string;
  initials?: string;
  size?: AvatarSize;
  className?: string;
};

export function Avatar({
  name = "",
  photo = "",
  initials = "",
  size = "md",
  className = ""
}: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(photo) && !broken;
  const label = (initials || name.trim().charAt(0) || "").slice(0, 2).toUpperCase();

  useEffect(() => {
    setBroken(false);
  }, [photo]);

  return (
    <span className={`${styles.avatar} ${styles[size]} ${showImage ? styles.hasPhoto : ""} ${className}`.trim()}>
      {showImage ? (
        <img src={photo} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      ) : label ? (
        <span className={styles.initials}>{label}</span>
      ) : (
        <PersonIcon className={styles.person} />
      )}
    </span>
  );
}
