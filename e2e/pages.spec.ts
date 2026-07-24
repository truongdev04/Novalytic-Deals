import { test, expect } from "@playwright/test";

// Fetches a real slug from the public API so this doesn't rot when seed
// data changes — the site has no fixed/guaranteed test fixtures today.
async function firstSlug(request: import("@playwright/test").APIRequestContext, path: string) {
  const res = await request.get(path);
  const body = await res.json();
  return body.data?.[0]?.slug as string | undefined;
}

test("homepage renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
});

test("store page renders for a real store", async ({ page, request }) => {
  const slug = await firstSlug(request, "/api/stores");
  test.skip(!slug, "no stores in the database to test against");
  await page.goto(`/store/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("blog post page renders for a real post", async ({ page, request }) => {
  const slug = await firstSlug(request, "/api/blog");
  test.skip(!slug, "no blog posts in the database to test against");
  await page.goto(`/blog/${slug}`);
  await expect(page.locator("h1")).toBeVisible();
});

test("unknown route shows the custom 404 page", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist-xyz");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Page not found")).toBeVisible();
});

test("unauthenticated visitor is redirected away from /admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});
