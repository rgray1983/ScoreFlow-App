import { DEFAULT_AWAY_COLOR, DEFAULT_HOME_COLOR, normalizeHex } from "../lib/color";
import {
  formatMatchDate,
  matchSetCount,
  type HistoryMatch
} from "../storage/matchHistory";

export const RESULTS_WIDTH = 1080;
export const RESULTS_HEIGHT = 1920;
export const DEFAULT_RESULTS_BACKGROUND = "/images/results/default.jpg";
export const BRAND_LOGO_SRC = "/scoreflow-logo.png";

function loadCanvasImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src || typeof Image === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function canvasRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function canvasInitials(value: string, fallback = "T"): string {
  const clean = String(value || fallback).trim().split(/\s+/).filter(Boolean);
  if (!clean.length) return fallback;
  return clean.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = String(text).split(" ");
  let line = "";
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function drawCanvasLogo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  fallback: string,
  x: number,
  y: number,
  size: number,
  options: { square?: boolean; noBadge?: boolean } = {}
) {
  ctx.save();
  if (!options.noBadge) {
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,.32)";
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.12;
    if (options.square) {
      canvasRoundRect(ctx, x - size / 2, y - size / 2, size, size, 18);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowColor = "transparent";
  }
  if (img) {
    const inset = options.noBadge ? 0 : size * 0.1;
    const drawSize = size - inset * 2;
    ctx.drawImage(img, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
  } else {
    ctx.fillStyle = options.noBadge ? "#ffffff" : "#07101e";
    ctx.font = `900 ${Math.round(size * 0.34)}px Inter, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(canvasInitials(fallback), x, y + 2);
  }
  ctx.restore();
}

export async function drawResultsGraphic(match: HistoryMatch): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = RESULTS_WIDTH;
  canvas.height = RESULTS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Results image could not be created");

  const w = canvas.width;
  const h = canvas.height;
  const homeName = match.homeName || "Team 1";
  const awayName = match.awayName || "Team 2";
  const homeColor = normalizeHex(match.homeColor, DEFAULT_HOME_COLOR);
  const awayColor = normalizeHex(match.awayColor, DEFAULT_AWAY_COLOR);
  const [bgImg, homeLogo, awayLogo, brandLogo] = await Promise.all([
    loadCanvasImage(DEFAULT_RESULTS_BACKGROUND),
    loadCanvasImage(match.homeLogo),
    loadCanvasImage(match.awayLogo),
    loadCanvasImage(BRAND_LOGO_SRC)
  ]);

  ctx.clearRect(0, 0, w, h);
  if (bgImg) {
    const scale = Math.max(w / bgImg.width, h / bgImg.height);
    const iw = bgImg.width * scale;
    const ih = bgImg.height * scale;
    ctx.drawImage(bgImg, (w - iw) / 2, (h - ih) / 2, iw, ih);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#3a2570");
    gradient.addColorStop(1, "#080b12");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.fillStyle = "rgba(5,7,12,.30)";
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w / 2, 160, 0, w / 2, 160, 540);
  glow.addColorStop(0, "rgba(255,255,255,.16)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,255,255,.76)";
  ctx.font = "900 28px Inter, Arial";
  ctx.fillText(formatMatchDate(match.updatedAtMs), w - 70, 72);

  drawCanvasLogo(ctx, homeLogo, homeName, w / 2, 270, 270, { noBadge: true });

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff1a6";
  ctx.font = "950 96px Inter, Arial";
  ctx.shadowColor = "rgba(0,0,0,.34)";
  ctx.shadowBlur = 18;
  ctx.fillText("MATCH RESULT", w / 2, 520);
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "rgba(255,255,255,.84)";
  ctx.font = "900 32px Inter, Arial";
  ctx.fillText(String(match.title || "Game Night").toUpperCase(), w / 2, 575);

  const barY = 720;
  const barH = 76;
  const leftLogoX = 156;
  const rightLogoX = w - 156;
  ctx.fillStyle = "rgba(255,255,255,.94)";
  ctx.shadowColor = "rgba(0,0,0,.20)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  canvasRoundRect(ctx, 150, barY, 350, barH, 8);
  ctx.fill();
  canvasRoundRect(ctx, w - 500, barY, 350, barH, 8);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "#07101e";
  ctx.font = "900 32px Inter, Arial";
  wrapCanvasText(ctx, homeName.toUpperCase(), 330, barY + 48, 260, 34);
  wrapCanvasText(ctx, awayName.toUpperCase(), w - 330, barY + 48, 260, 34);

  drawCanvasLogo(ctx, homeLogo, homeName, leftLogoX, barY + barH / 2, 138);
  drawCanvasLogo(ctx, awayLogo, awayName, rightLogoX, barY + barH / 2, 138);

  ctx.fillStyle = "#2258af";
  ctx.shadowColor = "rgba(0,0,0,.24)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  canvasRoundRect(ctx, w / 2 - 62, barY - 12, 124, 100, 28);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#ffffff";
  ctx.font = "950 40px Inter, Arial";
  ctx.fillText("VS", w / 2, barY + 40);

  const completed = match.completedSets;
  const rowCount = matchSetCount(match);
  const tableTop = 910;
  const rowGap = rowCount > 3 ? 118 : 140;
  ctx.strokeStyle = "rgba(255,255,255,.34)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w / 2, barY + 88);
  ctx.lineTo(w / 2, tableTop + rowGap * (rowCount - 1) + 54);
  ctx.stroke();

  ctx.font = "950 82px Inter, Arial";
  ctx.textBaseline = "middle";
  for (let i = 0; i < rowCount; i++) {
    const set = completed[i];
    const y = tableTop + i * rowGap;
    ctx.fillStyle = homeColor;
    ctx.textAlign = "right";
    ctx.fillText(set ? String(set.homeScore) : "–", w / 2 - 72, y);
    ctx.fillStyle = awayColor;
    ctx.textAlign = "left";
    ctx.fillText(set ? String(set.awayScore) : "–", w / 2 + 72, y);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,.76)";
  ctx.font = "800 28px Inter, Arial";
  ctx.fillText("Presented by", w / 2, h - 205);
  if (brandLogo) {
    ctx.drawImage(brandLogo, w / 2 - 132, h - 170, 264, 72);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.font = "950 48px Inter, Arial";
    ctx.fillText("ScoreFlow", w / 2, h - 132);
  }

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
      return;
    }
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const byteString = atob(dataUrl.split(",")[1] || "");
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
      resolve(new Blob([bytes], { type: "image/png" }));
    } catch {
      resolve(null);
    }
  });
}

function triggerDownload(dataUrl: string) {
  const link = document.createElement("a");
  link.download = "scoreflow-results.png";
  link.href = dataUrl;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function shareResultsGraphic(match: HistoryMatch): Promise<"shared" | "downloaded"> {
  const canvas = await drawResultsGraphic(match);
  const blob = await canvasToBlob(canvas);
  if (!blob) throw new Error("Results image could not be created");
  const file = typeof File === "function"
    ? new File([blob], "scoreflow-results.png", { type: "image/png" })
    : blob;
  const dataUrl = canvas.toDataURL("image/png");

  if (file instanceof File && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "ScoreFlow Results" });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "shared";
    }
  }

  triggerDownload(dataUrl);
  return "downloaded";
}
