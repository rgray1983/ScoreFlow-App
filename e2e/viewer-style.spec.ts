import { expect, test } from "./fixtures";

test("viewer styles stay individual, survive reload, follow the scorer on request, and fit phones", async ({ page, browser }, testInfo) => {
  test.setTimeout(120_000);
  await page.goto("/match");
  await page.getByRole("button", { name: "Share Live", exact: true }).click();
  await expect(page.getByText("Online", { exact: true })).toBeVisible({ timeout: 20000 });
  const url = await page.getByLabel("Viewer link").inputValue();
  await page.getByTestId("share-close").click();
  const contextA = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const contextB = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const productionCalls: string[] = [];
  for (const context of [contextA, contextB]) {
    await context.route((u) => u.protocol === "https:" && /(^|\.)(googleapis\.com|firebaseio\.com|firebaseapp\.com|firebasestorage\.app)$/.test(u.hostname), (r) => { productionCalls.push(r.request().url()); return r.abort(); });
  }
  try {
    const viewerA = await contextA.newPage();
    const viewerB = await contextB.newPage();
    for (const [viewer, name] of [[viewerA, "Fan A"], [viewerB, "Fan B"]] as const) {
      await viewer.goto(url);
      await viewer.getByRole("button", { name: "Watch Live Score" }).click();
      await viewer.getByLabel("Chat name").fill(name);
      await viewer.getByRole("button", { name: "Start Chatting" }).click();
    }
    const scorerBoard = page.getByRole("main", { name: "Volleyball scoreboard" });
    const boardA = viewerA.getByRole("main", { name: "Live volleyball scoreboard" });
    const boardB = viewerB.getByRole("main", { name: "Live volleyball scoreboard" });
    await viewerA.getByRole("button", { name: "Board style", exact: true }).click();
    await viewerA.getByRole("button", { name: /Old School/ }).click();
    await viewerA.getByRole("button", { name: "Done", exact: true }).click();
    await expect(boardA).toHaveAttribute("data-theme", "old-school");
    await expect(boardB).toHaveAttribute("data-theme", "classic");
    await expect(scorerBoard).toHaveAttribute("data-theme", "classic");
    await page.getByRole("button", { name: "Board style", exact: true }).click();
    await page.getByRole("button", { name: /Flip Clock/ }).click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: "Add point to Team 1", exact: true }).click();
    await expect(boardB).toHaveAttribute("data-theme", "flip-clock");
    await expect(boardA).toHaveAttribute("data-theme", "old-school");
    await expect(viewerA.getByTestId("home-score")).toHaveText("1");
    await expect(viewerB.getByTestId("home-score")).toHaveText("01");
    await expect(scorerBoard).toHaveAttribute("data-theme", "flip-clock");
    await viewerA.reload();
    await viewerA.getByRole("button", { name: "Watch Live Score" }).click();
    await expect(boardA).toHaveAttribute("data-theme", "old-school");
    await expect(viewerA.getByRole("button", { name: /Add point|Highlight call for/ })).toHaveCount(0);

    for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await viewerA.setViewportSize(size);
      const trigger = viewerA.getByRole("button", { name: "Board style", exact: true });
      const r = await trigger.boundingBox();
      expect(r!.x).toBeGreaterThanOrEqual(0); expect(r!.x + r!.width).toBeLessThanOrEqual(size.width);
      expect(r!.y).toBeGreaterThanOrEqual(0); expect(r!.y + r!.height).toBeLessThanOrEqual(size.height);
      await trigger.click();
      for (const [label, theme] of [[/Old School/, "old-school"], [/Flip Clock/, "flip-clock"], [/Classic/, "classic"]] as const) {
        await viewerA.getByRole("button", { name: label }).click();
        await expect(boardA).toHaveAttribute("data-theme", theme);
      }
      await viewerA.getByRole("button", { name: "Done", exact: true }).click();
      await viewerA.screenshot({ path: testInfo.outputPath(`individual-view-${size.width}x${size.height}.png`), animations: "disabled" });
      await expect(boardB).toHaveAttribute("data-theme", "flip-clock");
      await expect(scorerBoard).toHaveAttribute("data-theme", "flip-clock");
    }
    await viewerA.getByRole("button", { name: "Board style", exact: true }).click();
    await viewerA.getByRole("button", { name: /Follow scorer/ }).click();
    await viewerA.getByRole("button", { name: "Done", exact: true }).click();
    await expect(boardA).toHaveAttribute("data-theme", "flip-clock");
    await viewerA.screenshot({ path: testInfo.outputPath("viewer-flip-clock-clean.png"), animations: "disabled" });
    await page.screenshot({ path: testInfo.outputPath("scorer-flip-clock-clean.png"), animations: "disabled" });
    await page.getByRole("button", { name: "Board style", exact: true }).click();
    await page.getByRole("button", { name: /Old School/ }).click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(boardA).toHaveAttribute("data-theme", "old-school");
    await expect(boardB).toHaveAttribute("data-theme", "old-school");
    await viewerA.screenshot({ path: testInfo.outputPath("viewer-old-school-clean.png"), animations: "disabled" });
    expect(productionCalls).toEqual([]);
  } finally { await contextA.close(); await contextB.close(); }
});
