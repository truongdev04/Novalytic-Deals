import { test, expect } from "@playwright/test";

// These only check client-side validation errors — none of these forms are
// actually submitted, so no real newsletter subscriber / submitted coupon /
// review row is ever written to the (shared, production) database.

test("newsletter form rejects an invalid email without submitting", async ({ page }) => {
  await page.goto("/");
  const form = page.locator("form").filter({ has: page.getByLabel("Email address") }).first();
  const emailInput = form.getByLabel("Email address");

  await emailInput.fill("not-an-email");
  await form.getByRole("button", { name: /subscribe/i }).click();

  await expect(form.getByText(/valid email/i)).toBeVisible();
});

test("submit-coupon form shows validation errors for an empty submission", async ({ page }) => {
  await page.goto("/submit");
  await page.getByRole("button", { name: /submit coupon/i }).click();

  await expect(page.getByText(/store name is required/i)).toBeVisible();
});

test("review form on a store page requires a rating before submitting", async ({
  page,
  request,
}) => {
  const storesRes = await request.get("/api/stores");
  const stores = (await storesRes.json()).data as { slug: string }[];
  test.skip(!stores?.length, "no stores in the database to test against");

  await page.goto(`/store/${stores[0].slug}`);
  await page.getByRole("heading", { name: "Reviews" }).scrollIntoViewIfNeeded();
  await page.getByLabel("Your name").fill("QA Tester");
  await page.getByLabel("Title").fill("Test review title");
  await page.getByLabel("Review").fill("This review body is long enough to pass validation.");
  // No star clicked — rating stays 0, which is the one thing this submission is missing.
  await page.getByRole("button", { name: /submit review/i }).click();

  await expect(page.getByText(/choose a rating/i)).toBeVisible();
});
