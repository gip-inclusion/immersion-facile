import test, { expect, Page } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";
import { fillAutocomplete } from "../../utils/utils";

test.describe("Search", () => {
  test("can access and search with empty fields", async ({ page }) => {
    await page.goto("/");
    await page.click(`#${domElementIds.home.heroHeader.candidate}`);
    await page.click(`#${domElementIds.homeCandidates.heroHeader.search}`);
    await expect(page).toHaveURL(`/${frontRoutes.search}`);
    await expectSearchSubmitButtonToBeEnabled(page);
    await page.click(`#${domElementIds.search.searchSubmitButton}`);
    await expectSearchToHaveResults(page);
  });

  test("can search with location fields and clear it", async ({ page }) => {
    await page.goto(frontRoutes.search);
    await expectSearchSubmitButtonToBeEnabled(page);
    await fillAutocomplete({
      page,
      locator: `#${domElementIds.search.placeAutocompleteInput}`,
      value: "Paris",
    });
    await page.click(`#${domElementIds.search.searchSubmitButton}`);
    await expectSortFiltersToBe(page, [
      "Sélectionner une option",
      "Trier par date de publication",
      "Trier par pertinence",
      "Trier par proximité",
    ]);
    await expectSearchToHaveResults(page);
    await page.fill(`#${domElementIds.search.placeAutocompleteInput}`, "");
    await page.click(`#${domElementIds.search.searchSubmitButton}`);
    await expectSortFiltersToBe(page, [
      "Sélectionner une option",
      "Trier par date de publication",
      "Trier par pertinence",
    ]);
    await expectSearchToHaveResults(page);
  });
});

test.skip("checks that share URL have the correct params values", async () => {});

const expectSearchToHaveResults = async (page: Page) => {
  const searchResultsSelector = ".im-search-result";
  await page.waitForSelector(searchResultsSelector);
  await expect(
    await page.locator(searchResultsSelector).count(),
  ).toBeGreaterThan(0);
};

const expectSearchSubmitButtonToBeEnabled = async (page: Page) => {
  const searchSubmitButton = await page.locator(
    `#${domElementIds.search.searchSubmitButton}`,
  );
  await expect(searchSubmitButton).toBeVisible();
  await expect(searchSubmitButton).toBeEnabled();
};

const expectSortFiltersToBe = async (page: Page, filters: string[]) => {
  const selector = `#${domElementIds.search.sortFilter}`;
  page.waitForSelector(selector);
  const sortFiltersOptions = (
    await page.locator(`${selector}`).innerText()
  ).split("\n");
  await expect(await sortFiltersOptions).toEqual(filters);
};
