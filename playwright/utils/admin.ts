import { Locator, Page } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";

export const connectToAdmin = async (page: Page) => {
  await page.goto(frontRoutes.admin);
  await page.fill(
    `#${domElementIds.admin.adminPrivateRoute.formLoginUserInput}`,
    "admin",
  );
  await page.fill(
    `#${domElementIds.admin.adminPrivateRoute.formLoginPasswordInput}`,
    "admin",
  );
  await page.click(
    `#${domElementIds.admin.adminPrivateRoute.formLoginSubmitButton}`,
  );
};

export const goToTab = async (page: Page, tabName: string) => {
  await page.click(`.fr-tabs__tab:has-text("${tabName}")`);
};

export const openEmailInAdmin = async (
  page: Page,
  emailType: string,
  elementIndex = 0,
) => {
  await goToTab(page, "Notifications");
  await page
    .locator(`.fr-accordion:has-text("${emailType}")`)
    .nth(elementIndex)
    .click();
};

export const getMagicLinkInEmailWrapper = (emailWrapper: Locator) =>
  emailWrapper.locator("span:has-text('magicLink') ~ a");
