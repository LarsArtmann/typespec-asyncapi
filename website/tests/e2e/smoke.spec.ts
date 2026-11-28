import { expect, test } from "@playwright/test";

test("landing page loads with hero and header nav", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AsyncAPI/i);
  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("main")).toBeVisible();
});

test("docs search page responds", async ({ page }) => {
  await page.goto("/search/");
  await expect(page.locator("main")).toBeVisible();
});

test("faq page exposes FAQPage JSON-LD", async ({ page }) => {
  await page.goto("/faq/");
  const ld = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  expect(ld).toBeTruthy();
  const parsed = JSON.parse(ld ?? "{}") as { "@type"?: string };
  expect(parsed["@type"]).toBe("FAQPage");
});

test("copy button copies the emitted document", async ({ page }) => {
  await page.addInitScript(() => {
    window.navigator.clipboard.writeText = async () => undefined;
  });
  await page.goto("/");
  const copy = page.locator("[data-copy-target]").first();
  await expect(copy).toBeVisible();
  await copy.click();
  await expect(copy).toBeEnabled();
});
