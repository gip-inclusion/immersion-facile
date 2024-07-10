import { Page } from "@playwright/test";
import {
  EstablishmentDashboardTab,
  establishmentDashboardTabsList,
} from "shared";
import { getTabIndexByTabName } from "./admin";

export const goToEstablishmentDashboardTab = async (
  page: Page,
  tab: EstablishmentDashboardTab,
) => {
  const tabLocator = await page
    .locator(".fr-tabs__list li")
    .nth(getTabIndexByTabName(establishmentDashboardTabsList, tab))
    .locator(".fr-tabs__tab");
  await tabLocator.click({ force: true });
};
