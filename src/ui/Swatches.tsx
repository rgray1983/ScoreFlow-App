import { TEAM_COLORS } from "../lib/color";
import styles from "./Swatches.module.css";

type SwatchesProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
};

export function Swatches({ value, onChange, label }: SwatchesProps) {
  return (
    <div className={styles.wrap}>
      <h3>{label}</h3>
      <div className={styles.row} role="list">
        {TEAM_COLORS.map((color) => (
          <button
            key={color.value}
            className={`${styles.swatch} ${color.value === value ? styles.active : ""}`}
            type="button"
            title={color.name}
            aria-label={color.name}
            style={{ background: color.value }}
            onClick={() => onChange(color.value)}
          />
        ))}
      </div>
    </div>
  );
}
