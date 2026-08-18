export const DEFAULT_HOME_COLOR = "#d62828";
export const DEFAULT_AWAY_COLOR = "#1565c0";

export const TEAM_COLORS = [
  { name: "Red", value: "#d62828" },
  { name: "Orange", value: "#f97316" },
  { name: "Gold", value: "#fbbf24" },
  { name: "Green", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Blue", value: "#1565c0" },
  { name: "Purple", value: "#7e22ce" },
  { name: "Pink", value: "#ec4899" },
  { name: "Gray", value: "#6b7280" },
  { name: "Black", value: "#111827" }
] as const;

export function normalizeHex(value: string | undefined, fallback = DEFAULT_HOME_COLOR): string {
  const raw = String(value || "").trim();
  const expanded = raw.replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, "#$1$1$2$2$3$3");
  return /^#[a-f\d]{6}$/i.test(expanded) ? expanded.toLowerCase() : fallback;
}

export function hexToRgb(hex: string) {
  const safe = normalizeHex(hex).slice(1);
  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16)
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((value) => {
    const safe = Math.max(0, Math.min(255, Math.round(value)));
    return safe.toString(16).padStart(2, "0");
  }).join("")}`;
}

export function hsvToHex(h: number, s: number, v: number): string {
  const hue = ((Number(h) % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, Number(s))) / 100;
  const val = Math.max(0, Math.min(100, Number(v))) / 100;
  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export function hexToHsv(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const rp = r / 255;
  const gp = g / 255;
  const bp = b / 255;
  const max = Math.max(rp, gp, bp);
  const min = Math.min(rp, gp, bp);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === rp) hue = ((gp - bp) / delta) % 6;
    else if (max === gp) hue = (bp - rp) / delta + 2;
    else hue = (rp - gp) / delta + 4;
    hue *= 60;
  }
  if (hue < 0) hue += 360;
  return {
    hue: Math.round(hue),
    saturation: max === 0 ? 0 : Math.round((delta / max) * 100),
    value: Math.round(max * 100)
  };
}
