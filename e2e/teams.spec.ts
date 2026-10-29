import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { createMatch } from "../src/scoring";
import { EMPTY_MATCH_DRAFT } from "../src/storage/matchSetup";

const player = { id: "sophia", name: "Sophia", number: "12" };
const team = { id: "panthers", name: "Panthers", color: "#82283d", logo: "", location: "McBee, SC", updatedAtMs: 1, roster: [player, { id: "sam", name: "Sam", number: "07" }] };
async function seedRoster(page: Page, pro = true) {
  await page.addInitScript(({ team, pro, draft, engine }) => {
    if (localStorage.getItem("scoreflowTeamsV1")) return;
    localStorage.setItem("scoreflowPremiumV1", JSON.stringify({ isPro: pro }));
    localStorage.setItem("scoreflowTeamsV1", JSON.stringify({ teams: [team], selectedId: team.id }));
    localStorage.setItem("scoreflowHomeTeamV2", JSON.stringify(team));
    localStorage.setItem("scoreflowMatchDraftV1", JSON.stringify(draft));
    localStorage.setItem("scoreflowMatchEngineV1", JSON.stringify(engine));
    localStorage.setItem("scoreflowMatchContextV1", JSON.stringify({ draft, roster: team.roster }));
  }, { team, pro, draft: { ...EMPTY_MATCH_DRAFT, homeName: team.name, homeColor: team.color }, engine: createMatch({ homeName: team.name, homeColor: team.color }) });
  await page.goto("/match");
}
async function call(page: Page, kind = "Kill") {
  await page.getByRole("button", { name: "Roster", exact: true }).click();
  await page.getByRole("button", { name: /#12 Sophia/ }).click();
  await page.getByRole("button", { name: `${kind} for Sophia, add one point`, exact: true }).click();
}
async function share(page: Page) {
  await page.getByRole("button", { name: "Share Live", exact: true }).click();
  await expect(page.getByText("Online", { exact: true })).toBeVisible({ timeout: 20000 });
  const url = await page.getByLabel("Viewer link").inputValue();
  await page.getByTestId("share-close").click();
  return url;
}
async function watch(viewer: Page, url: string) {
  await viewer.goto(url);
  await viewer.getByRole("button", { name: "Watch Live Score" }).click();
  await viewer.getByLabel("Chat name").fill("Family Fan");
  await viewer.getByRole("button", { name: "Start Chatting" }).click();
}

test("Pro can save and switch separately branded rosters; Free keeps its home setup", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Setup Your Home Team", exact: true }).click();
  await expect(page.getByRole("button", { name: "Add Player", exact: true })).toHaveCount(0);
  await page.getByLabel("Team Name", { exact: true }).fill("Panthers");
  await page.getByRole("button", { name: "Save Home Team", exact: true }).click();
  await page.getByRole("button", { name: "Try Pro", exact: true }).click();
  await page.getByRole("link", { name: "Manage Teams & Rosters", exact: true }).click();
  await page.getByRole("button", { name: "Add Player", exact: true }).click();
  await page.getByLabel("Player 1 name", { exact: true }).fill("Sophia");
  await page.getByLabel("Player 1 number", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Save Team", exact: true }).click();
  await page.getByRole("link", { name: "Manage Teams & Rosters", exact: true }).click();
  await page.getByRole("button", { name: "Create Team", exact: true }).click();
  await page.getByLabel("Team Name", { exact: true }).fill("JV Panthers");
  await page.getByLabel("City, State", { exact: true }).fill("Hartsville, SC");
  await page.getByRole("button", { name: "Add Player", exact: true }).click();
  await page.getByLabel("Player 1 name", { exact: true }).fill("Sam");
  await page.getByLabel("Player 1 number", { exact: true }).fill("07");
  await page.getByRole("button", { name: "Save Team", exact: true }).click();
  await page.reload();
  await page.getByRole("link", { name: "Start A Match", exact: true }).click();
  await page.getByRole("combobox", { name: "Your saved team", exact: true }).selectOption({ label: "Panthers" });
  await page.getByRole("button", { name: "Start Scoreboard", exact: true }).click();
  await page.getByRole("button", { name: "Roster", exact: true }).click();
  await expect(page.getByRole("button", { name: /#12 Sophia/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /#07 Sam/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Close roster" }).click();
  await page.getByRole("button", { name: "Add point to Panthers", exact: true }).click();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("link", { name: "Manage Teams & Rosters", exact: true }).click();
  await page.getByRole("combobox", { name: "Saved team", exact: true }).selectOption({ label: "JV Panthers" });
  await page.getByRole("button", { name: "Save Team", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Resume Match", exact: true }).click();
  await page.getByRole("button", { name: "Roster", exact: true }).click();
  await expect(page.getByRole("button", { name: /#12 Sophia/ })).toBeVisible();
});

for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`roster drawer and actions fit ${size.width}x${size.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(size);
    await seedRoster(page);
    await page.getByRole("button", { name: "Roster", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Your Team", exact: true });
    await expect(dialog).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("roster.png"), animations: "disabled" });
    await page.getByRole("button", { name: /#12 Sophia/ }).click();
    for (const kind of ["Ace", "Kill", "Block"]) {
      const button = page.getByRole("button", { name: `${kind} for Sophia, add one point` });
      await expect(button).toBeVisible();
      const r = await button.boundingBox();
      expect(r!.x).toBeGreaterThanOrEqual(0); expect(r!.x + r!.width).toBeLessThanOrEqual(size.width);
      expect(r!.y).toBeGreaterThanOrEqual(0); expect(r!.y + r!.height).toBeLessThanOrEqual(size.height);
      expect(r!.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: testInfo.outputPath("actions.png"), animations: "disabled" });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("home-score")).toHaveText("0");
    await call(page, "Ace");
    await expect(page.getByTestId("home-score")).toHaveText("1");
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Roster", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(page.getByTestId("home-score")).toHaveText("0");
  });
}

test("player highlights reconnect once, survive scorer reload, undo in the viewer, and stay out of chat", async ({ page, browser }, testInfo) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await seedRoster(page);
  const url = await share(page);
  const fans = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const forbidden: string[] = [];
  await fans.route((u) => u.protocol === "https:" && /(^|\.)(googleapis\.com|firebaseio\.com|firebaseapp\.com|firebasestorage\.app)$/.test(u.hostname), (r) => { forbidden.push(r.request().url()); return r.abort(); });
  try {
    const viewer = await fans.newPage();
    await watch(viewer, url);
    await page.context().setOffline(true);
    await call(page, "Kill"); await call(page, "Block");
    await expect(page.getByTestId("home-score")).toHaveText("2");
    await page.context().setOffline(false);
    await page.route((u) => u.hostname === "127.0.0.1" && [8080, 9099, 9199].includes(Number(u.port)), (r) => r.abort());
    await page.reload();
    await expect(page.getByTestId("home-score")).toHaveText("2");
    await page.unrouteAll();
    await expect(viewer.getByTestId("home-score")).toHaveText("2", { timeout: 25_000 });
    if (await page.getByLabel("Viewer link").isVisible()) await page.getByTestId("share-close").click();
    await viewer.getByRole("tab", { name: /Play by Play/ }).click();
    await expect(viewer.getByTestId("play-event")).toHaveCount(2);
    await viewer.screenshot({ path: testInfo.outputPath("viewer-plays.png"), animations: "disabled" });
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(viewer.getByTestId("play-event")).toHaveCount(1);
    await expect(viewer.getByTestId("home-score")).toHaveText("1");
    await viewer.getByRole("tab", { name: "Chat", exact: true }).click();
    await expect(viewer.getByTestId("play-event")).toHaveCount(0);
    await viewer.getByLabel("Chat message", { exact: true }).fill("Go Panthers!");
    await viewer.getByRole("button", { name: "Send", exact: true }).click();
    await expect(viewer.getByRole("tabpanel")).toContainText("Go Panthers!");
    await viewer.setViewportSize({ width: 844, height: 390 });
    await call(page, "Ace");
    await expect(viewer.getByTestId("fan-popup").filter({ hasText: "#12 Sophia — Ace!" })).toBeVisible();
    await viewer.screenshot({ path: testInfo.outputPath("viewer-popup.png"), animations: "disabled" });
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(viewer.getByTestId("fan-popup").filter({ hasText: "#12 Sophia — Ace!" })).toHaveCount(0);
    await page.getByRole("button", { name: "Share Live", exact: true }).click();
    await expect(page.getByLabel("Viewer link")).toHaveValue(url);
    await page.getByTestId("share-close").click();
    await viewer.setViewportSize({ width: 390, height: 844 });
    await viewer.getByRole("tab", { name: /Play by Play/ }).click();
    await page.context().setOffline(true);
    await page.getByRole("button", { name: "Home", exact: true }).click();
    await page.getByRole("button", { name: "End Match", exact: true }).click();
    await page.context().setOffline(false);
    await page.reload();
    await expect(viewer.getByText("Match Ended", { exact: true })).toBeVisible({ timeout: 25_000 });
    await expect(viewer.getByTestId("play-event")).toHaveCount(1);
    expect(forbidden).toEqual([]);
  } finally { await fans.close(); }
});

test("chat and reactions continue beyond their old limits, and older chat paginates without replay", async ({ page, context }) => {
  test.setTimeout(120_000); // Seeds 140 emulator writes before testing the live window.
  await seedRoster(page);
  const url = await share(page);
  const gameId = url.split("/g/")[1];
  await page.evaluate(async (gameId) => {
    const path = "/live/fanZone.ts";
    const { sendChatMessage, sendReaction } = await import(path);
    for (let i = 1; i <= 70; i++) {
      await sendChatMessage({ gameId, text: `Cheer ${i}`, name: "Test Fan", role: "scorer", sessionId: "scorer" });
      await sendReaction(gameId, "👏");
    }
  }, gameId);
  const viewer = await context.newPage();
  await viewer.setViewportSize({ width: 390, height: 844 });
  await watch(viewer, url);
  const feed = viewer.getByRole("tabpanel");
  await expect(feed.getByText("Cheer 70", { exact: true })).toBeVisible();
  await expect(feed.getByText("Cheer 1", { exact: true })).toHaveCount(0);
  await viewer.getByRole("button", { name: "Earlier messages", exact: true }).click();
  await expect(feed.getByText("Cheer 1", { exact: true })).toBeAttached();
  await expect(feed.locator("article")).toHaveCount(70);
  await viewer.getByLabel("Chat message", { exact: true }).fill("Still here after seventy!");
  await viewer.getByRole("button", { name: "Send", exact: true }).click();
  await expect(feed).toContainText("Still here after seventy!");
  await viewer.setViewportSize({ width: 844, height: 390 });
  await expect(viewer.getByTestId("fan-popup").filter({ hasText: /^Cheer / })).toHaveCount(0);
  await page.evaluate(async (gameId) => {
    const path = "/live/fanZone.ts";
    const { sendChatMessage, sendReaction } = await import(path);
    await sendChatMessage({ gameId, text: "The newest cheer", name: "Test Fan", role: "scorer", sessionId: "scorer" });
    await sendReaction(gameId, "🔥");
  }, gameId);
  await expect(viewer.getByTestId("fan-popup").filter({ hasText: "The newest cheer" })).toBeVisible();
  await expect(viewer.locator(".scoreflow-floating-reaction").filter({ hasText: "🔥" })).not.toHaveCount(0);
});

test("Free never exposes a saved Pro roster while regular scoring stays available", async ({ page }) => {
  await seedRoster(page, false);
  await expect(page.getByRole("button", { name: "Roster", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Add point to Panthers", exact: true }).click();
  await expect(page.getByTestId("home-score")).toHaveText("1");
});
