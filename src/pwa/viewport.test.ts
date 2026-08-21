import { describe, expect, it } from "vitest";
import { applyStandaloneShell, isStandaloneDisplay } from "./viewport";

describe("standalone display", () => {
  it("treats iOS home-screen web apps as standalone", () => {
    expect(isStandaloneDisplay({ standalone: true }, { matches: false })).toBe(true);
    expect(isStandaloneDisplay({ standalone: false }, { matches: true })).toBe(true);
    expect(isStandaloneDisplay({ standalone: false }, { matches: false })).toBe(false);
    expect(isStandaloneDisplay({}, null)).toBe(false);
  });

  it("marks the document so CSS can use 100vh instead of 100dvh", () => {
    const classes = new Set<string>();
    const root = {
      classList: {
        toggle(name: string, force?: boolean) {
          if (force) classes.add(name);
          else classes.delete(name);
        }
      }
    };
    expect(applyStandaloneShell(root, true)).toBe(true);
    expect(classes.has("scoreflow-standalone")).toBe(true);
    applyStandaloneShell(root, false);
    expect(classes.has("scoreflow-standalone")).toBe(false);
  });
});
