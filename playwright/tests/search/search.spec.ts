import test, { expect } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";

test.describe("Search", () => {
  test("can access and search with empty fields", async ({ page }) => {
    await page.goto("/");
    await page.click(`#${domElementIds.home.heroHeader.candidate}`);
    await page.click(`#${domElementIds.homeCandidates.heroHeader.search}`);
    await expect(page).toHaveURL(`/${frontRoutes.search}`);
    const searchSubmitButton = await page.locator(
      `#${domElementIds.search.searchSubmitButton}`,
    );
    await expect(searchSubmitButton).toBeVisible();
    await expect(searchSubmitButton).toBeEnabled();
    await page.click(`#${domElementIds.search.searchSubmitButton}`);
    const searchResultsSelector = ".im-search-result";
    await page.waitForSelector(searchResultsSelector);
    await expect(
      await page.locator(searchResultsSelector).count(),
    ).toBeGreaterThan(0);
  });
});
