import { afterEach, describe, expect, it, vi } from "vitest";
import { selectInputText } from "./Field";

describe("selectInputText", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("selects the field on the next frame so a tap can replace the value", () => {
    const select = vi.fn();
    vi.stubGlobal("window", {
      requestAnimationFrame(callback: FrameRequestCallback) {
        callback(0);
        return 1;
      }
    });
    selectInputText({ currentTarget: { select } } as never);
    expect(select).toHaveBeenCalledOnce();
  });
});
