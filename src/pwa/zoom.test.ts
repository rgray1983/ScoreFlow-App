import { describe, expect, it, vi } from "vitest";
import { lockPageZoom, shouldBlockZoomGesture } from "./zoom";

describe("page zoom lock", () => {
  it("blocks two-finger gestures and allows one-finger scroll", () => {
    expect(shouldBlockZoomGesture(1)).toBe(false);
    expect(shouldBlockZoomGesture(2)).toBe(true);
  });

  it("cancels iOS pinch gesture events", () => {
    const listeners = new Map<string, EventListener>();
    const target = {
      addEventListener(type: string, listener: EventListener) {
        listeners.set(type, listener);
      }
    };
    lockPageZoom(target);
    const event = { preventDefault: vi.fn() } as unknown as Event;
    listeners.get("gesturestart")?.(event);
    listeners.get("gesturechange")?.(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(2);
  });
});
