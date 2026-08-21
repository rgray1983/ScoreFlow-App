import { useLayoutEffect, useRef } from "react";
import { fitFontSize, shouldRefitName } from "./boardChrome";

type FitTextProps = {
  text: string;
  className?: string;
  minPx?: number;
};

export function FitText({ text, className = "", minPx = 10 }: FitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const slot = el?.parentElement;
    if (!el || !slot) return undefined;

    const node = el;
    const box = slot;
    let fittedWidth = -1;

    function fit(nextWidth = Math.round(box.clientWidth)) {
      if (!shouldRefitName(fittedWidth, nextWidth)) return;
      fittedWidth = nextWidth;
      if (nextWidth <= 0) return;

      if (node.scrollWidth > nextWidth) {
        let size = Number.parseFloat(node.style.fontSize) || Number.parseFloat(getComputedStyle(node).fontSize) || 16;
        let guard = 0;
        while (node.scrollWidth > nextWidth && size > minPx && guard < 24) {
          size = fitFontSize(node.scrollWidth, nextWidth, size, minPx);
          node.style.fontSize = `${size}px`;
          guard += 1;
        }
        return;
      }

      if (!node.style.fontSize) return;
      const kept = node.style.fontSize;
      node.style.fontSize = "";
      if (node.scrollWidth > nextWidth) node.style.fontSize = kept;
    }

    fit();
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    if (typeof ResizeObserver === "undefined") {
      return () => window.removeEventListener("resize", onResize);
    }
    const observer = new ResizeObserver((entries) => {
      fit(Math.round(entries[0]?.contentRect.width ?? box.clientWidth));
    });
    observer.observe(box);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [minPx, text]);

  return <span ref={ref} className={className}>{text}</span>;
}
