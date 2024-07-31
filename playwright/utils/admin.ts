import { Locator, Page, expect } from "@playwright/test";
import {
  AdminTab,
  AdminTabList,
  EstablishmentDashboardTab,
  EstablishmentDashboardTabList,
  adminTabsList,
  domElementIds,
  frontRoutes,
} from "shared";
import { loginWithInclusionConnect } from "./inclusionConnect";

export const goToAdminTab = async (page: Page, tabName: AdminTab) => {
  const adminButton = await page.locator("#fr-header-main-navigation-button-4");
  const isUserAdminConnected = await adminButton.isVisible();
  if (!isUserAdminConnected) {
    await expect(isUserAdminConnected).toBe(false);
    await loginWithInclusionConnect(page, "admin");
  }
  await expect(adminButton).toBeVisible();
  await adminButton.click();
  await page
    .locator(`#${domElementIds.header.navLinks.admin.backOffice}`)
    .click();
  await page.waitForTimeout(500); // wait for the submenu to close (its visibility makes hard to click on tabs)
  const tabLocator = await page
    .locator(".fr-tabs__list li")
    .nth(getTabIndexByTabName(adminTabsList, tabName))
    .locator(".fr-tabs__tab");
  await expect(tabLocator).toBeVisible();
  await tabLocator.click();
  expect(await page.url()).toContain(`${frontRoutes.admin}/${tabName}`);
};

export const openEmailInAdmin = async (
  page: Page,
  emailType: string,
  elementIndex = 0,
) => {
  await goToAdminTab(page, "notifications");
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
  tabList: AdminTabList | EstablishmentDashboardTabList,
  tabName: AdminTab | EstablishmentDashboardTab,
) => {
  const index = tabList.findIndex((tab) => tab === tabName);
  if (index === -1) {
    throw new Error(`Tab ${tabName} not found in adminTabs`);
  }
  return index;
};
