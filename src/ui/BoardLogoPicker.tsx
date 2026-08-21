import { LogoMark } from "./LogoMark";
import { resizeImageFile } from "../lib/logo";

type BoardLogoPickerProps = {
  name: string;
  logo?: string;
  color?: string;
  label: string;
  wrapClassName?: string;
  markClassName?: string;
  onChange: (logo: string) => void;
};

export function BoardLogoPicker({
  name,
  logo,
  color,
  label,
  wrapClassName = "",
  markClassName = "",
  onChange
}: BoardLogoPickerProps) {
  return (
    <label className={wrapClassName} title={label}>
      <input
        type="file"
        accept="image/*"
        aria-label={label}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            onChange(await resizeImageFile(file));
          } catch {
            // Keep the current logo if the file cannot be read.
          }
        }}
      />
      <LogoMark className={markClassName} name={name} logo={logo} color={color} />
    </label>
  );
}
