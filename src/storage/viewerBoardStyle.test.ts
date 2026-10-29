import { describe, expect, it } from "vitest";
import { memoryStorage } from "./local";
import { VIEWER_BOARD_STYLE_KEY, loadViewerBoardStyle, parseViewerBoardStyle, saveViewerBoardStyle, viewerBoardTheme } from "./viewerBoardStyle";

describe("individual viewer board style", () => {
  it("accepts the three styles and defaults missing or corrupt data to following the scorer", () => {
    for (const style of ["classic", "old-school", "flip-clock"] as const) expect(parseViewerBoardStyle(style)).toBe(style);
    for (const invalid of [undefined, null, {}, "neon", true]) expect(parseViewerBoardStyle(invalid)).toBe("follow");
    expect(loadViewerBoardStyle(memoryStorage({ [VIEWER_BOARD_STYLE_KEY]: "invalid json" }))).toBe("follow");
  });
  it("remembers a local override across reload, then can resume following changing scorer styles", () => {
    const storage = memoryStorage();
    expect(saveViewerBoardStyle("old-school", storage)).toBe(true);
    expect(viewerBoardTheme(loadViewerBoardStyle(storage), "flip-clock")).toBe("old-school");
    expect(viewerBoardTheme(loadViewerBoardStyle(memoryStorage()), "flip-clock")).toBe("flip-clock");
    saveViewerBoardStyle("follow", storage);
    expect(viewerBoardTheme(loadViewerBoardStyle(storage), "classic")).toBe("classic");
    expect(viewerBoardTheme(loadViewerBoardStyle(storage), "flip-clock")).toBe("flip-clock");
  });
  it("does not claim a persisted choice when storage is blocked", () => {
    expect(saveViewerBoardStyle("classic", null)).toBe(false);
    expect(saveViewerBoardStyle("classic", { ...memoryStorage(), setItem() { throw Error("blocked"); } })).toBe(false);
  });
});
