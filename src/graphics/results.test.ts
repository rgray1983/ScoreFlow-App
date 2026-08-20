import { describe, expect, it } from "vitest";
import { canvasInitials } from "./results";

describe("results graphic helpers", () => {
  it("builds one or two initials from a team name", () => {
    expect(canvasInitials("Blazers")).toBe("B");
    expect(canvasInitials("Sandhills Blazers")).toBe("SB");
    expect(canvasInitials("  ")).toBe("T");
  });
});
