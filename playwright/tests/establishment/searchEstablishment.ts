import { expect } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";
import { PlaywrightTestCallback } from "../../utils/utils";
import { TestEstablishments } from "./establishmentForm.utils";

export const searchEstablishmentAndExpectResultToHaveLength =
  (
    testEstablishments: TestEstablishments,
    expectedResultsQty: number,
  ): PlaywrightTestCallback =>
  async ({ page }, { retry }) => {
    await page.goto(frontRoutes.search);
    await page.fill(
      `#${domElementIds.search.placeAutocompleteInput}`,
      "Poitiers",
    );
    await page
      .getByRole("option", {
        name: "Poitiers, Nouvelle-Aquitaine, France",
      })
      .first()
      .click();
    await page.getByRole("button", { name: "Rechercher" }).click();
    const resultsSelector = `#${domElementIds.search.searchResultButton}-${testEstablishments[retry].siret}`;
    await expect(await page.locator(resultsSelector)).toHaveCount(
      expectedResultsQty,
    );
  };
