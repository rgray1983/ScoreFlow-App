import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./ConfettiBurst.module.css";

type Piece = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  spin: number;
  color: string;
};

type ConfettiBurstProps = {
  active: boolean;
  colors: string[];
  contained?: boolean;
};

export function ConfettiBurst({ active, colors, contained = false }: ConfettiBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteKey = colors.join("|");

  useEffect(() => {
    if (!active) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;

    const surface = canvas;
    const drawCtx = ctx;
    const palette = paletteKey ? paletteKey.split("|") : ["#fff", "#fbbf24"];
    let frame = 0;
    let running = true;
    let pieces: Piece[] = [];

    function size() {
      const parent = surface.parentElement;
      return {
        width: contained && parent ? parent.clientWidth : window.innerWidth,
        height: contained && parent ? parent.clientHeight : window.innerHeight
      };
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = size();
      surface.width = Math.floor(width * dpr);
      surface.height = Math.floor(height * dpr);
      drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      const { width, height } = size();
      pieces = Array.from({ length: 140 }, () => ({
        x: Math.random() * width,
        y: -20 - Math.random() * height,
        size: 5 + Math.random() * 9,
        speed: 1.7 + Math.random() * 4.2,
        drift: -1.5 + Math.random() * 3,
        spin: Math.random() * Math.PI,
        color: palette[Math.floor(Math.random() * palette.length)]
      }));
    }

    function draw() {
      if (!running) return;
      const { width, height } = size();
      drawCtx.clearRect(0, 0, width, height);
      pieces.forEach((piece) => {
        piece.y += piece.speed;
        piece.x += piece.drift;
        piece.spin += 0.12;
        if (piece.y > height + 30) {
          piece.y = -30;
          piece.x = Math.random() * width;
        }
        if (piece.x < -30) piece.x = width + 30;
        if (piece.x > width + 30) piece.x = -30;
        drawCtx.save();
        drawCtx.translate(piece.x, piece.y);
        drawCtx.rotate(piece.spin);
        drawCtx.fillStyle = piece.color;
        drawCtx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.62);
        drawCtx.restore();
      });
      frame = window.requestAnimationFrame(draw);
    }

    resize();
    spawn();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      drawCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
  }, [active, contained, paletteKey]);

  if (!active) return null;

  const canvas = (
    <canvas
      ref={canvasRef}
      className={contained ? styles.contained : styles.canvas}
      aria-hidden="true"
    />
  );

  if (contained || typeof document === "undefined") return canvas;
  return createPortal(canvas, document.body);
}
