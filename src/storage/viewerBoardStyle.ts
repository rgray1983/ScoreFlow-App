import type { BoardTheme } from "../scoring";
import { browserStorage, readJson, type JsonStorage } from "./local";

export type ViewerBoardStyle = BoardTheme | "follow";
export const VIEWER_BOARD_STYLE_KEY = "scoreflowViewerBoardStyleV1";

export function parseViewerBoardStyle(value: unknown): ViewerBoardStyle {
  return value === "classic" || value === "old-school" || value === "flip-clock" ? value : "follow";
}
export function loadViewerBoardStyle(storage?: JsonStorage | null): ViewerBoardStyle {
  return parseViewerBoardStyle(readJson(VIEWER_BOARD_STYLE_KEY, "follow", storage));
}
export function saveViewerBoardStyle(style: ViewerBoardStyle, storage: JsonStorage | null = browserStorage()): boolean {
  if (!storage) return false;
  try { storage.setItem(VIEWER_BOARD_STYLE_KEY, JSON.stringify(style)); return true; }
  catch { return false; }
}
export function viewerBoardTheme(preference: ViewerBoardStyle, scorerTheme: BoardTheme = "classic"): BoardTheme {
  return preference === "follow" ? scorerTheme : preference;
}
