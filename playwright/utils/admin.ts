import { Locator, Page } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";

export const connectToAdmin = async (page: Page) => {
  await page.goto(frontRoutes.admin);
  await page.fill(
    `#${domElementIds.admin.adminPrivateRoute.formLoginUserInput}`,
    process.env.ADMIN_USER ?? "admin",
  );
  await page.fill(
    `#${domElementIds.admin.adminPrivateRoute.formLoginPasswordInput}`,
    process.env.ADMIN_PASSWORD ?? "admin",
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
  const emailSection = page
    .locator(`.fr-accordion:has-text("${emailType}")`)
    .nth(elementIndex);
  await emailSection.locator(".fr-accordion__btn").click();
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
