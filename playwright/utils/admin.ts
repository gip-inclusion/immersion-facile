import { expect, Locator, Page } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";

const adminUser = process.env.ADMIN_USER ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "password";

export const connectToAdmin = async (page: Page) => {
  await page.goto(frontRoutes.admin);
  await page.fill(
    `#${domElementIds.admin.adminPrivateRoute.formLoginUserInput}`,
    adminUser,
  );
  await page.fill(
    `#${domElementIds.admin.adminPrivateRoute.formLoginPasswordInput}`,
    adminPassword,
  );
  await expect(
    page.locator(
      `#${domElementIds.admin.adminPrivateRoute.formLoginUserInput}`,
    ),
  ).toHaveValue(adminUser);
  await expect(
    page.locator(
      `#${domElementIds.admin.adminPrivateRoute.formLoginPasswordInput}`,
    ),
  ).toHaveValue(adminPassword);

  await page.click(
    `#${domElementIds.admin.adminPrivateRoute.formLoginSubmitButton}`,
  );
  await expect(page.locator(".fr-alert--error")).not.toBeVisible();
};

export const goToTab = async (page: Page, tabName: string) => {
  const locator = page.locator(`.fr-tabs__tab:has-text("${tabName}")`);
  await expect(locator).toBeVisible();
  await locator.click();
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
