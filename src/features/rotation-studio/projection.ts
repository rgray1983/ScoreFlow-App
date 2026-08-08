import type { LogicalPoint } from './types';

export type ScreenPoint = { x: number; y: number };
export type CourtMetrics = { width: number; height: number };

/**
 * Perspective court: trapezoid with the net along the far edge.
 * Logical (0..1, 0..1) maps into the home-side playable area.
 */
const NEAR_LEFT = { x: 0.08, y: 0.9 };
const NEAR_RIGHT = { x: 0.92, y: 0.9 };
const FAR_LEFT = { x: 0.22, y: 0.12 };
const FAR_RIGHT = { x: 0.78, y: 0.12 };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

/** Convert logical court coordinates to percent-of-court screen coordinates. */
export function logicalToScreen(point: LogicalPoint): ScreenPoint {
  const y = clamp01(point.y);
  const x = clamp01(point.x);
  const left = lerp(NEAR_LEFT.x, FAR_LEFT.x, y);
  const right = lerp(NEAR_RIGHT.x, FAR_RIGHT.x, y);
  const top = lerp(NEAR_LEFT.y, FAR_LEFT.y, y);
  return {
    x: (left + (right - left) * x) * 100,
    y: top * 100
  };
}

/**
 * Inverse projection from percent screen coordinates back to logical space.
 * Uses the same trapezoid edges so dragging stays accurate under perspective.
 */
export function screenToLogical(screen: ScreenPoint, _metrics?: CourtMetrics): LogicalPoint {
  const sx = clamp01(screen.x / 100);
  const sy = clamp01(screen.y / 100);

  // Solve for y along the vertical blend between near and far edges.
  const y = clamp01((NEAR_LEFT.y - sy) / (NEAR_LEFT.y - FAR_LEFT.y || 1));
  const left = lerp(NEAR_LEFT.x, FAR_LEFT.x, y);
  const right = lerp(NEAR_RIGHT.x, FAR_RIGHT.x, y);
  const width = right - left || 1;
  const x = clamp01((sx - left) / width);
  return { x, y };
}

export function depthScale(logicalY: number): number {
  return lerp(1.08, 0.78, clamp01(logicalY));
}

export function pointerToLogical(
  clientX: number,
  clientY: number,
  rect: DOMRect
): LogicalPoint {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0.5, y: 0.5 };
  return screenToLogical({
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100
  });
}
