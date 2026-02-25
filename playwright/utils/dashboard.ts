import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import {
  domElementIds,
  type EstablishmentDashboardTab,
  establishmentDashboardTabsList,
  frontRoutes,
} from "shared";
import { getTabIndexByTabName } from "./admin";
import { fillConventionForm } from "./convention";

export const goToEstablishmentDashboardTab = async (
  page: Page,
  tab: EstablishmentDashboardTab,
) => {
  await page.waitForTimeout(2000);
  await page.waitForSelector(".fr-tabs__list li");
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

export const createConventionTemplate = async (
  page: Page,
  dashboardKind: "agency" | "establishment",
) => {
  await page.goto("/");
  await goToDashboard(page, dashboardKind);

  await page.click(
    `#${domElementIds.conventionTemplate.createConventionTemplateButton}`,
  );
  await page.waitForURL(`${frontRoutes.conventionTemplate}**`);

  await page.fill(
    `#${domElementIds.conventionTemplate.form.nameInput}`,
    "Mon premier modèle de convention",
  );
  await fillConventionForm(page);

  await page.click(
    `#${domElementIds.conventionTemplate.form.submitFormButton}`,
  );
  await expect(page.locator(".fr-alert--success")).toBeVisible();

  await goToDashboard(page, dashboardKind);
  await expect(page.locator('[id^="convention-template-"]')).toHaveCount(1);
};

export const deleteConventionTemplate = async (
  page: Page,
  dashboardKind: "agency" | "establishment",
) => {
  await page.goto("/");
  await goToDashboard(page, dashboardKind);

  await expect(page.locator('[id^="convention-template-"]')).toHaveCount(1);

  await page.click(
    `[id^="${domElementIds.conventionTemplate.deleteConventionTemplateButton}-"]`,
  );
  await page.click(
    `#${domElementIds.conventionTemplate.deleteConventionTemplate.confirmButton}`,
  );
  await expect(page.locator(".fr-alert--success")).toBeVisible();
  await expect(page.locator('[id^="convention-template-"]')).toHaveCount(0);
};
