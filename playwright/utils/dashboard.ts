import { Page } from "@playwright/test";
import {
  EstablishmentDashboardTab,
  domElementIds,
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

export const goToDashboard = async (
  page: Page,
  userKind: "agency" | "establishment",
) => {
  const selector =
    userKind === "agency"
      ? "#fr-header-main-navigation-button-3"
      : "#fr-header-main-navigation-button-2";
  await page.click(selector);
  const submenuItemSelector = `#${domElementIds.header.navLinks[userKind].dashboard}`;
  await page.click(submenuItemSelector);
};
