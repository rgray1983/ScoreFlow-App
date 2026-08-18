import styles from "./LogoMark.module.css";

type LogoMarkProps = {
  name: string;
  logo?: string;
  color?: string;
  className?: string;
};

export function LogoMark({ name, logo, color, className = "" }: LogoMarkProps) {
  const initial = (name || "T").charAt(0).toUpperCase();
  return (
    <span
      className={`${styles.mark} ${logo ? styles.hasLogo : ""} ${className}`}
      style={color ? { background: color } : undefined}
    >
      {logo ? <img src={logo} alt="" /> : <span>{initial}</span>}
    </span>
  );
}
