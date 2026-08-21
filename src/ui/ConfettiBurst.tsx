import { useEffect, useRef } from "react";
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
};

export function ConfettiBurst({ active, colors }: ConfettiBurstProps) {
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

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      surface.width = Math.floor(window.innerWidth * dpr);
      surface.height = Math.floor(window.innerHeight * dpr);
      drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      pieces = Array.from({ length: 140 }, () => ({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * window.innerHeight,
        size: 5 + Math.random() * 9,
        speed: 1.7 + Math.random() * 4.2,
        drift: -1.5 + Math.random() * 3,
        spin: Math.random() * Math.PI,
        color: palette[Math.floor(Math.random() * palette.length)]
      }));
    }

    function draw() {
      if (!running) return;
      drawCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      pieces.forEach((piece) => {
        piece.y += piece.speed;
        piece.x += piece.drift;
        piece.spin += 0.08;
        if (piece.y > window.innerHeight + 20) {
          piece.y = -20;
          piece.x = Math.random() * window.innerWidth;
        }
        drawCtx.save();
        drawCtx.translate(piece.x, piece.y);
        drawCtx.rotate(piece.spin);
        drawCtx.fillStyle = piece.color;
        drawCtx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
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
  }, [active, paletteKey]);

  if (!active) return null;
  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
