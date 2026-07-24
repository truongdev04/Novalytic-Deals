import { test, expect } from "@playwright/test";

test("searching a store name from the homepage navigates to a store page", async ({
  page,
  request,
}) => {
  const storesRes = await request.get("/api/stores");
  const stores = (await storesRes.json()).data as { name: string }[];
  test.skip(!stores?.length, "no stores in the database to search for");

  // A longer prefix reduces the chance another store shares it and wins
  // the alphabetically-sorted top spot in /api/search's results.
  const query = stores[0].name.slice(0, Math.min(6, stores[0].name.length));

  await page.goto("/");
  const searchInput = page.getByLabel("Search stores").first();
  const searchResponse = page.waitForResponse((res) => res.url().includes("/api/search"));
  await searchInput.fill(query);
  await searchResponse;
  await searchInput.press("Enter");
  await expect(page).toHaveURL(/\/store\//);
});
