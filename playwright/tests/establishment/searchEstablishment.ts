import { expect } from "@playwright/test";
import { type FormEstablishmentDto, domElementIds, frontRoutes } from "shared";
import type { PlaywrightTestCallback } from "../../utils/utils";
import type { MakeFormEstablishmentFromRetryNumber } from "./establishmentForm.utils";

export const searchEstablishmentAndExpectResultToHaveLength =
  (
    makeUpdatedEstablishment: MakeFormEstablishmentFromRetryNumber,
    expectedResultsQty: number,
  ): PlaywrightTestCallback =>
  async ({ page }, { retry }) => {
    const updatedEstablishment = makeUpdatedEstablishment(retry);
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
