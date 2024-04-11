import { Locator, Page, expect } from "@playwright/test";
import { AdminTab, adminTabsList, domElementIds, frontRoutes } from "shared";

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

export const goToAdminTab = async (page: Page, tabName: AdminTab) => {
  const adminButton = await page.locator("#fr-header-main-navigation-button-4");
  const isUserAdminConnected = await adminButton.isVisible();
  if (!isUserAdminConnected) {
    await expect(isUserAdminConnected).toBe(false);
    await connectToAdmin(page);
  }
  await expect(adminButton).toBeVisible();
  await adminButton.click();
  await page
    .locator(`#${domElementIds.header.navLinks.admin.backOffice}`)
    .click();
  const tabLocator = page
    .locator(".fr-tabs__list li")
    .nth(getTabIndexByTabName(tabName))
    .locator(".fr-tabs__tab");
  await expect(tabLocator).toBeVisible();
  const tabPanelId = await tabLocator.getAttribute("id");
  await tabLocator.click({ force: true });
  await page.locator(`[aria-labelledby="${tabPanelId}"]`).waitFor(); // can't select by ID because of the : in the ID, but we can select by aria-labelledby
  expect(page.url()).toContain(`${frontRoutes.admin}/${tabName}`);
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

const getTabIndexByTabName = (tabName: AdminTab) => {
  const index = adminTabsList.findIndex((tab) => tab === tabName);
  if (index === -1) {
    throw new Error(`Tab ${tabName} not found in adminTabs`);
  }
  return index;
};
