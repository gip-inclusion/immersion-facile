import { type Locator, type Page, expect } from "@playwright/test";
import {
  type AdminTabRouteName,
  type EmailType,
  type EstablishmentDashboardTab,
  adminTabRouteNames,
  adminTabs,
  domElementIds,
  frontRoutes,
} from "shared";

export const goToAdminTab = async (page: Page, tabName: AdminTabRouteName) => {
  const adminButton = await page.locator("#fr-header-main-navigation-button-4");
  await expect(adminButton).toBeVisible();
  await adminButton.click();
  await page
    .locator(`#${domElementIds.header.navLinks.admin.backOffice}`)
    .click();
  await page.waitForTimeout(500); // wait for the submenu to close (its visibility makes hard to click on tabs)
  const tabLocator = await page
    .locator(".fr-tabs__list li")
    .nth(getTabIndexByTabName(adminTabRouteNames, tabName))
    .locator(".fr-tabs__tab");
  await expect(tabLocator).toBeVisible();
  await tabLocator.click();
  expect(await page.url()).toContain(
    `${frontRoutes.admin}/${adminTabs[tabName].slug}`,
  );
};

export const openEmailInAdmin = async (
  page: Page,
  emailType: EmailType,
  elementIndex = 0,
) => {
  await goToAdminTab(page, "adminNotifications");
  const emailSection = page
    .locator(`.fr-accordion:has-text("${emailType}")`)
    .nth(elementIndex);
  const locator = emailSection.locator(".fr-accordion__btn");
  await expect(locator).toBeVisible();
  await locator.click();
  return emailSection;
};

export const getMagicLinkInEmailWrapper = (
  emailWrapper: Locator,
  label = "magicLink",
) =>
  emailWrapper
    .locator("li")
    .filter({
      hasText: label,
    })
    .getByRole("link")
    .getAttribute("href");

export const getTabIndexByTabName = (
  tabList: readonly AdminTabRouteName[] | readonly EstablishmentDashboardTab[],
  tabName: AdminTabRouteName | EstablishmentDashboardTab,
) => {
  const index = tabList.findIndex((tab) => tab === tabName);
  if (index === -1) {
    throw new Error(`Tab ${tabName} not found in adminTabs`);
  }
  return index;
};
