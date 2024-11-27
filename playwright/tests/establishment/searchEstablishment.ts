import { PlaywrightTestArgs, TestInfo, expect } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";
import { EstablishmentsRetries } from "./establishmentForm.utils";

export const searchEstablishment =
  (establishmentRetries: EstablishmentsRetries, expectedResultsQty: number) =>
  async ({ page }: PlaywrightTestArgs, { retry }: TestInfo): Promise<void> => {
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
    const resultsSelector = `#${domElementIds.search.searchResultButton}-${establishmentRetries[retry].siret}`;
    await expect(await page.locator(resultsSelector)).toHaveCount(
      expectedResultsQty,
    );
  };
