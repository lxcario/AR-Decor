import { expect, test } from "@playwright/test";

test("Home to Product Funnel", async ({ page }) => {
  await page.goto("/");

  const firstCatalogCard = page
    .locator('main a[href^="/products/"]:not([href$="/ar"])')
    .first();

  await expect(firstCatalogCard).toBeVisible();
  await firstCatalogCard.click();

  await expect(page).toHaveURL(/\/products\//);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("Inline 3D Viewer Launch", async ({ page }) => {
  await page.goto("/");
  await page
    .locator('main a[href^="/products/"]:not([href$="/ar"])')
    .first()
    .click();

  await expect(page).toHaveURL(/\/products\//);

  await page.getByRole("button", { name: "View in 3D" }).click();

  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("canvas").first()).toBeAttached();
});

test("AR Gateway Routing", async ({ page }) => {
  await page.goto("/");
  await page
    .locator('main a[href^="/products/"]:not([href$="/ar"])')
    .first()
    .click();

  await expect(page).toHaveURL(/\/products\//);

  await page.getByRole("link", { name: /View in Your Room/i }).click();

  await expect(page).toHaveURL(/\/products\/[^/]+\/ar/);
  await expect(
    page.getByText(
      /interactive 3D preview instead|AR is not available in this browser|AR needs a secure connection|Camera access is required/i,
    ),
  ).toBeVisible();
});
