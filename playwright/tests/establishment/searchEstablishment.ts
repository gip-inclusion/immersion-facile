import { expect } from "@playwright/test";
import { type FormEstablishmentDto, domElementIds, frontRoutes } from "shared";
import type { PlaywrightTestCallback } from "../../utils/utils";

export const searchEstablishmentAndExpectResultToHaveLength =
  (
    updatedEstablishment: FormEstablishmentDto,
    expectedResultsQty: number,
  ): PlaywrightTestCallback =>
  async ({ page }) => {
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
    const resultsSelector = `#${domElementIds.search.searchResultButton}-${updatedEstablishment.siret}`;
    await expect(await page.locator(resultsSelector)).toHaveCount(
      expectedResultsQty,
    );
  };
