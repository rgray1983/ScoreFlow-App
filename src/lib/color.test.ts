import { describe, expect, it } from "vitest";
import { hsvToHex, hexToHsv, normalizeHex } from "./color";

describe("normalizeHex", () => {
  it("accepts full hex", () => {
    expect(normalizeHex("#D62828")).toBe("#d62828");
  });

  it("expands shorthand", () => {
    expect(normalizeHex("#f00")).toBe("#ff0000");
  });

  it("falls back on junk", () => {
    expect(normalizeHex("blue", "#1565c0")).toBe("#1565c0");
  });
});

describe("hsv round trip", () => {
  it("keeps a pure red", () => {
    expect(hexToHsv("#ff0000")).toEqual({ hue: 0, saturation: 100, value: 100 });
    expect(hsvToHex(0, 100, 100)).toBe("#ff0000");
  });
});
