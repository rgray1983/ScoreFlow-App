import { LogoMark } from "./LogoMark";
import { StackedText } from "./StackedText";
import { resizeImageFile } from "../lib/logo";
import styles from "./LogoUploader.module.css";

type LogoUploaderProps = {
  name: string;
  logo: string;
  color?: string;
  onChange: (logo: string) => void;
  onError?: (message: string) => void;
};

export function LogoUploader({ name, logo, color, onChange, onError }: LogoUploaderProps) {
  return (
    <label className={styles.uploader}>
      <input
        type="file"
        accept="image/*"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            onChange(await resizeImageFile(file));
          } catch {
            onError?.("Could not read that image.");
          }
        }}
      />
      <LogoMark name={name} logo={logo} color={color} />
      <StackedText
        title="Upload Team Logo"
        copy="PNG or JPG works best. Photos are resized before saving."
      />
    </label>
  );
}
