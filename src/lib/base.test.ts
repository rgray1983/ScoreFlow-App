import { describe, expect, it } from "vitest";
import { routerBasename, viteBase, withBase } from "./base";

describe("withBase", () => {
  it("keeps public files on the Vite base path", () => {
    expect(viteBase()).toBe("/");
    expect(routerBasename()).toBeUndefined();
    expect(withBase("scoreflow-logo.png")).toBe("/scoreflow-logo.png");
    expect(withBase("/images/results/default.jpg")).toBe("/images/results/default.jpg");
    expect(withBase("https://cdn.example/a.png")).toBe("https://cdn.example/a.png");
    expect(withBase("/g/abc", "/ScoreFlow-App/")).toBe("/ScoreFlow-App/g/abc");
    expect(withBase("scoreflow-logo.png", "/ScoreFlow-App/")).toBe("/ScoreFlow-App/scoreflow-logo.png");
  });
});
