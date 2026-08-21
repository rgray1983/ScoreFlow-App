import { expect, test } from "@playwright/test";

test("scorer can add a point on the Vite board", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Start A Match" }).click();
  await page.getByRole("button", { name: "Start Scoreboard" }).click();
  await expect(page.getByTestId("home-score")).toHaveText("0");
  await page.getByRole("button", { name: "Add point to Team 1" }).click();
  await expect(page.getByTestId("home-score")).toHaveText("1");
});

test("a scorer point appears on the live viewer", async ({ page, context }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Start A Match" }).click();
  await page.getByRole("button", { name: "Start Scoreboard" }).click();
  await page.getByRole("button", { name: "Share Live" }).click();
  const link = page.getByLabel("Viewer link");
  await expect(link).toHaveValue(/\/g\/[a-f0-9]{32}/i, { timeout: 25_000 });
  const url = await link.inputValue();
  await expect(page.getByText("Online", { exact: true })).toBeVisible({ timeout: 25_000 });
  await page.getByTestId("share-close").click();
  await expect(page.getByTestId("share-shade")).toHaveCount(0);

  const viewer = await context.newPage();
  await viewer.goto(url);
  await viewer.getByRole("button", { name: "Watch Live Score" }).click();
  const chatName = viewer.getByLabel("Chat name");
  await chatName.waitFor({ state: "visible", timeout: 8_000 }).catch(() => undefined);
  if (await chatName.isVisible().catch(() => false)) {
    await chatName.fill("E2E Fan");
    await viewer.getByRole("button", { name: "Start Chatting" }).click();
  }
  await expect(viewer.getByText("Online", { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(viewer.getByTestId("home-score")).toHaveText("0");

  await page.getByRole("button", { name: "Add point to Team 1" }).click();
  await expect(page.getByTestId("home-score")).toHaveText("1");
  await expect(viewer.getByTestId("home-score")).toHaveText("1", { timeout: 15_000 });
});
