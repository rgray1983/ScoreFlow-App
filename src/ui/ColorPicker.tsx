import { useEffect, useRef, useState } from "react";
import { hexToHsv, hsvToHex, normalizeHex } from "../lib/color";
import styles from "./ColorPicker.module.css";

type ColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const color = normalizeHex(value);
  const hsv = hexToHsv(color);
  const [hexText, setHexText] = useState(color);
  const fieldRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;

  useEffect(() => {
    setHexText(color);
  }, [color]);

  useEffect(() => {
    const bind = (target: HTMLDivElement | null, handler: (event: PointerEvent) => void) => {
      if (!target) return () => undefined;
      const onDown = (event: PointerEvent) => {
        event.preventDefault();
        target.setPointerCapture(event.pointerId);
        handler(event);
        const onMove = (moveEvent: PointerEvent) => handler(moveEvent);
        const onUp = () => {
          target.removeEventListener("pointermove", onMove);
          target.removeEventListener("pointerup", onUp);
          target.removeEventListener("pointercancel", onUp);
        };
        target.addEventListener("pointermove", onMove);
        target.addEventListener("pointerup", onUp);
        target.addEventListener("pointercancel", onUp);
      };
      target.addEventListener("pointerdown", onDown);
      return () => target.removeEventListener("pointerdown", onDown);
    };

    const onField = (event: PointerEvent) => {
      const field = fieldRef.current;
      if (!field) return;
      const rect = field.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      onChange(hsvToHex(hsvRef.current.hue, Math.round(x * 100), Math.round((1 - y) * 100)));
    };

    const onHue = (event: PointerEvent) => {
      const track = hueRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      onChange(hsvToHex(Math.round(x * 360), hsvRef.current.saturation, hsvRef.current.value));
    };

    const unbindField = bind(fieldRef.current, onField);
    const unbindHue = bind(hueRef.current, onHue);
    return () => {
      unbindField();
      unbindHue();
    };
  }, [onChange]);

  return (
    <section className={styles.picker} aria-label="Team color picker">
      <div className={styles.head}>
        <h3>Team Color</h3>
        <input
          className={styles.hex}
          maxLength={7}
          value={hexText}
          aria-label="Team color hex value"
          onChange={(event) => {
            const next = event.target.value.trim();
            setHexText(next);
            if (/^#([a-f\d]{3}|[a-f\d]{6})$/i.test(next)) {
              onChange(normalizeHex(next, color));
            }
          }}
        />
      </div>
      <div
        ref={fieldRef}
        className={styles.field}
        style={{ ["--picker-hue" as string]: hsvToHex(hsv.hue, 100, 100) }}
      >
        <button
          className={styles.thumb}
          type="button"
          aria-label="Adjust team color saturation and brightness"
          style={{
            left: `${hsv.saturation}%`,
            top: `${100 - hsv.value}%`,
            background: color
          }}
        />
      </div>
      <div ref={hueRef} className={styles.hue}>
        <button
          className={`${styles.thumb} ${styles.hueThumb}`}
          type="button"
          aria-label="Adjust team color hue"
          style={{
            left: `${(hsv.hue / 360) * 100}%`,
            background: hsvToHex(hsv.hue, 100, 100)
          }}
        />
      </div>
    </section>
  );
}
