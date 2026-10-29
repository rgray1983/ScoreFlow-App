import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { createMatch, type MatchState } from "../src/scoring";

async function seed(page: Page, overrides: Partial<MatchState> = {}) {
  const engine = createMatch(overrides);
  await page.addInitScript((value) => {
    if (!localStorage.getItem("scoreflowMatchEngineV1")) {
      localStorage.setItem("scoreflowMatchEngineV1", JSON.stringify(value));
      localStorage.setItem("scoreflowAccountProfileV1", JSON.stringify({ displayName: "Richie", avatar: "", updatedAtMs: Date.now() }));
    }
  }, engine);
  await page.goto("/match");
}

test("pressure, highlight Undo, and a set gate survive mobile scoring and reload", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, { homeScore: 23, awayScore: 22 });
  const board = page.getByRole("main", { name: "Volleyball scoreboard" });
  await page.getByRole("button", { name: "Add point to Team 1", exact: true }).click();
  await expect(board).toHaveAttribute("data-pressure", "home");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(board).not.toHaveAttribute("data-pressure");
  await page.getByRole("button", { name: "Highlight call for Team 1", exact: true }).click();
  await page.getByRole("button", { name: "ace! +1", exact: true }).click();
  await expect(page.getByTestId("home-score")).toHaveText("24");
  await expect(page.getByTestId("highlight-burst")).toBeVisible();
  await expect(page.getByText("POINT Team 1!", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByTestId("highlight-burst")).toHaveCount(0);
  await expect(page.getByTestId("home-score")).toHaveText("23");
  await page.getByRole("button", { name: "Add point to Team 1", exact: true }).click();
  await page.getByRole("button", { name: "Highlight call for Team 1", exact: true }).click();
  await page.getByRole("button", { name: "kill! +1", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Set 2", exact: true })).toBeVisible();
  await expect(page.getByTestId("highlight-burst")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Set 2", exact: true })).toBeVisible();
  await expect(page.getByTestId("highlight-burst")).toHaveCount(0);
  await page.getByRole("button", { name: "Start Set 2", exact: true }).click();
  await expect(page.getByTestId("home-score")).toHaveText("0");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByTestId("home-score")).toHaveText("24");
  await expect(board).toHaveAttribute("data-pressure", "home");
});

test("families follow style, run, highlight, held decider, and match winner", async ({ page, context }) => {
  await seed(page, { matchFormat: "highschool", setNumber: 4, homeSets: 2, awaySets: 1,
    homeScore: 23, awayScore: 23, runSide: "home", runLength: 4 });
  await page.getByRole("button", { name: "Share Live", exact: true }).click();
  const link = page.getByLabel("Viewer link");
  await expect(link).toHaveValue(/\/g\/[a-f0-9]{32}/i);
  await expect(page.getByText("Online", { exact: true })).toBeVisible();
  const url = await link.inputValue();
  await page.getByTestId("share-close").click();
  const viewer = await context.newPage();
  await viewer.goto(url);
  await viewer.getByRole("button", { name: "Watch Live Score" }).click();
  await viewer.getByLabel("Chat name").fill("Test Fan");
  await viewer.getByRole("button", { name: "Start Chatting" }).click();
  await expect(viewer.getByText("Scored by Richie")).toBeVisible();

  await page.getByRole("button", { name: "Board style", exact: true }).click();
  await page.getByRole("button", { name: /Old School/ }).click();
  await expect(viewer.getByRole("main")).toHaveAttribute("data-theme", "old-school");
  await page.getByRole("button", { name: /Flip Clock/ }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(viewer.getByRole("main")).toHaveAttribute("data-theme", "flip-clock");
  await page.getByRole("button", { name: "Highlight call for Team 1", exact: true }).click();
  await page.getByRole("button", { name: "kill! +1", exact: true }).click();
  await expect(viewer.getByTestId("home-score")).toHaveText("24");
  await expect(viewer.getByTestId("run-home")).toContainText("5–0 RUN");
  await expect(viewer.getByTestId("highlight-burst")).toBeVisible();
  await expect(viewer.getByRole("main")).toHaveAttribute("data-pressure-kind", "match");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(viewer.getByTestId("home-score")).toHaveText("23");
  await expect(viewer.getByTestId("highlight-burst")).toHaveCount(0);
  await page.getByRole("button", { name: "Add point to Team 2", exact: true }).click();
  await expect(viewer.getByTestId("away-score")).toHaveText("24");
  await page.getByRole("button", { name: "Add point to Team 2", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Deciding Set", exact: true })).toBeVisible();
  await expect(viewer.getByText("Waiting for the scorer to start set 5…")).toBeVisible();
  await viewer.reload();
  await viewer.getByRole("button", { name: "Watch Live Score" }).click();
  await expect(viewer.getByText("Waiting for the scorer to start set 5…")).toBeVisible();
  await page.getByRole("button", { name: "Start Set 5", exact: true }).click();
  await expect(viewer.getByTestId("home-score")).toHaveText("00");
  await expect(viewer.getByTestId("away-score")).toHaveText("00");
  await expect(viewer.getByText("Waiting for the scorer to start set 5…")).toHaveCount(0);
  for (let i = 0; i < 14; i++) await page.getByRole("button", { name: "Add point to Team 1", exact: true }).click();
  await expect(viewer.getByRole("main")).toHaveAttribute("data-pressure-kind", "match");
  await page.getByRole("button", { name: "Highlight call for Team 1", exact: true }).click();
  await page.getByRole("button", { name: "ace! +1", exact: true }).click();
  await expect(viewer.getByTestId("home-score")).toHaveText("15");
  await expect(viewer.getByText("MATCH WON — Team 1", { exact: true })).toBeAttached();
  await expect(page.getByRole("dialog", { name: "Deciding Set", exact: true })).toHaveCount(0);
});

for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1024, height: 768 }]) {
  test(`controls stay reachable at ${size.width}x${size.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(size);
    await seed(page, { homeName: "McBee Panthers", awayName: "Great Falls Red Devils", homeScore: 14, awayScore: 12, runSide: "home", runLength: 7 });
    for (const name of ["Add point to McBee Panthers", "Highlight call for Great Falls Red Devils", "Board style", "Share Live"]) {
      const button = page.getByRole("button", { name, exact: true });
      await expect(button).toBeVisible();
      const bounds = await button.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(size.width + 1);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(size.height + 1);
      expect(await button.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        return node.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2));
      })).toBe(true);
    }
    await page.getByRole("button", { name: "Board style", exact: true }).click();
    await page.getByRole("button", { name: /Old School/ }).click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath("old-school.png"), animations: "disabled" });
    await page.getByRole("button", { name: "Board style", exact: true }).click();
    await page.getByRole("button", { name: /Flip Clock/ }).click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    const score = await page.getByTestId("home-score").locator("span").first().boundingBox();
    const plus = await page.getByRole("button", { name: "Add point to McBee Panthers", exact: true }).boundingBox();
    expect(score!.y + score!.height, "flip digits must not overlap scoring controls").toBeLessThanOrEqual(plus!.y + 1);
    await page.screenshot({ path: testInfo.outputPath("flip-clock.png"), animations: "disabled" });
  });
}

test("the read-only viewer keeps digits visible in phone and tablet orientations", async ({ page, context }, testInfo) => {
  await seed(page, { homeName: "McBee Panthers", awayName: "Great Falls Red Devils", homeScore: 14, awayScore: 12, runSide: "home", runLength: 7, boardTheme: "flip-clock" });
  await page.getByRole("button", { name: "Share Live", exact: true }).click();
  await expect(page.getByText("Online", { exact: true })).toBeVisible();
  const url = await page.getByLabel("Viewer link").inputValue();
  const viewer = await context.newPage();
  await viewer.goto(url);
  await viewer.getByRole("button", { name: "Watch Live Score" }).click();
  await viewer.getByLabel("Chat name").fill("Layout Fan");
  await viewer.getByRole("button", { name: "Start Chatting" }).click();
  await expect(viewer.getByRole("button", { name: /Add point|Set .+ as serving/ })).toHaveCount(0);
  for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1024, height: 768 }]) {
    await viewer.setViewportSize(size);
    const board = await viewer.getByRole("main").boundingBox();
    for (const side of ["home", "away"]) {
      const score = await viewer.getByTestId(`${side}-score`).locator("span").first().boundingBox();
      expect(score!.x).toBeGreaterThanOrEqual(board!.x);
      expect(score!.y).toBeGreaterThanOrEqual(board!.y);
      expect(score!.x + score!.width).toBeLessThanOrEqual(board!.x + board!.width);
      expect(score!.y + score!.height).toBeLessThanOrEqual(board!.y + board!.height);
    }
    await viewer.screenshot({ path: testInfo.outputPath(`viewer-${size.width}x${size.height}.png`), animations: "disabled" });
  }
});

test("one-minute timeouts count down together and restore on Undo", async ({ page, context }) => {
  await seed(page);
  await page.getByRole("button", { name: "Share Live", exact: true }).click();
  await expect(page.getByText("Online", { exact: true })).toBeVisible();
  const url = await page.getByLabel("Viewer link").inputValue();
  await page.getByTestId("share-close").click();
  const viewer = await context.newPage();
  await viewer.goto(url);
  await viewer.getByRole("button", { name: "Watch Live Score" }).click();
  await viewer.getByLabel("Chat name").fill("Timeout Fan");
  await viewer.getByRole("button", { name: "Start Chatting" }).click();
  const now = Date.now();
  await page.clock.setFixedTime(now);
  await viewer.clock.setFixedTime(now);
  await page.getByRole("button", { name: "Call timeout for Team 1", exact: true }).first().click();
  await expect(page.getByTestId("timeout-scorer")).toContainText("1:00");
  await expect(viewer.getByTestId("timeout-viewer")).toContainText("1:00");
  await page.clock.setFixedTime(now + 1000);
  await viewer.clock.setFixedTime(now + 1000);
  await expect(page.getByTestId("timeout-scorer")).toContainText("0:59");
  await expect(viewer.getByTestId("timeout-viewer")).toContainText("0:59");
  await page.getByRole("button", { name: "End timeout", exact: true }).click();
  await expect(viewer.getByTestId("timeout-viewer")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByTestId("timeout-scorer")).toContainText("0:59");
  await expect(viewer.getByTestId("timeout-viewer")).toContainText("0:59");
});

test('offline rallies reload and reconnect to the original viewer; offline end survives reload', async ({ page, browser }) => {
  await seed(page);
  await page.getByRole('button', {name:'Share Live',exact:true}).click();
  await expect(page.getByText('Online',{exact:true})).toBeVisible();
  const url = await page.getByLabel('Viewer link').inputValue();
  await page.getByTestId('share-close').click();
  const fans = await browser.newContext();
  const viewer = await fans.newPage();
  await viewer.goto(url);
  await viewer.getByRole('button',{name:'Watch Live Score'}).click();
  await viewer.getByLabel('Chat name').fill('Offline Fan');
  await viewer.getByRole('button',{name:'Start Chatting'}).click();
  await page.context().setOffline(true);
  for(let i=0;i<4;i++) await page.getByRole('button',{name:'Add point to Team 1',exact:true}).click();
  await expect(page.getByTestId('home-score')).toHaveText('4');
  // Reload the application while blocking its Firebase transport, but allow Vite
  // assets to load. PWA shell caching is separately verified by the production build.
  await page.context().setOffline(false);
  await page.route(url=>url.hostname==='127.0.0.1' && [8080,9099,9199].includes(Number(url.port)),r=>r.abort());
  await page.reload();
  await expect(page.getByTestId('home-score')).toHaveText('4');
  await page.setViewportSize({width:320,height:568});
  await expect(page.getByText('Pending',{exact:true})).toBeVisible();
  const pendingBounds = await page.getByText('Pending',{exact:true}).boundingBox();
  expect(pendingBounds!.x + pendingBounds!.width).toBeLessThanOrEqual(320);
  await page.unrouteAll();
  await expect(viewer.getByTestId('home-score')).toHaveText('4',{timeout:25000});
  if (!await page.getByLabel('Viewer link').isVisible()) await page.getByRole('button',{name:'Share Live',exact:true}).click();
  await expect(page.getByLabel('Viewer link')).toHaveValue(url);
  await page.getByTestId('share-close').click();
  await page.context().setOffline(true);
  await page.getByRole('button',{name:'Home',exact:true}).click();
  await page.getByRole('button',{name:'End Match',exact:true}).click();
  await expect(page.getByRole('link',{name:'Start A Match',exact:true})).toBeVisible();
  await page.context().setOffline(false);
  await page.reload();
  await expect(viewer.getByText('Match Ended',{exact:true})).toBeVisible({timeout:25000});
  await fans.close();
});
