import { useLayoutEffect, useRef } from "react";
import { fitFontSize } from "./boardChrome";

type FitTextProps = {
  text: string;
  className?: string;
  minPx?: number;
};

export function FitText({ text, className = "", minPx = 10 }: FitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    function fit() {
      if (!el) return;
      if (el.clientWidth <= 0) return;
      el.style.fontSize = "";
      const start = Number.parseFloat(getComputedStyle(el).fontSize) || 16;
      let size = start;
      let guard = 0;
      while (el.scrollWidth > el.clientWidth && size > minPx && guard < 40) {
        size = fitFontSize(el.scrollWidth, el.clientWidth, size, minPx);
        el.style.fontSize = `${size}px`;
        guard += 1;
      }
    }

    fit();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    if (el.parentElement) observer.observe(el.parentElement);
    return () => observer.disconnect();
  }, [minPx, text]);

  return <span ref={ref} className={className}>{text}</span>;
}
