import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import { goToAdminTab } from "../../utils/admin";
import { fillAutocomplete } from "../../utils/utils";

test.describe("Manage users in admin", () => {
  test.use({ storageState: testConfig.adminAuthFile });

  test("Can add a user to an agency", async ({ page }) => {
    await page.goto("/");
    await goToAdminTab(page, "agencies");
    await fillAutocomplete({
      page,
      locator: `#${domElementIds.admin.agencyTab.editAgencyAutocompleteInput}`,
      value: "PE Paris",
    });
    await expect(
      page.locator(`#${domElementIds.admin.agencyTab.agencyUsersTable}`),
    ).toBeVisible();
    const addUserButton = page.locator(
      `#${domElementIds.admin.agencyTab.openManageUserModalButton}`,
    );
    await expect(addUserButton).toBeVisible();
    await addUserButton.click();
    await expect(
      page.locator(
        `#${domElementIds.admin.agencyTab.editAgencyManageUserModal}`,
      ),
    ).toBeVisible();
    await page
      .locator(`#${domElementIds.admin.agencyTab.editAgencyUserEmail}`)
      .fill(faker.internet.email());
    await page
      .locator(
        `[for="${domElementIds.admin.agencyTab.editAgencyManageUserCheckbox}-3"]`,
      )
      .click();
    await page
      .locator(
        `#${domElementIds.admin.agencyTab.editAgencyUserIsNotifiedByEmail}`,
      )
      .click();
    await page
      .locator(
        `#${domElementIds.admin.agencyTab.editAgencyUserRoleSubmitButton}`,
      )
      .click();
    await expect(page.locator(".fr-alert--success").first()).toBeVisible();
  });

  test("Can edit roles of a user", async ({ page }) => {
    await page.goto("/");
    await goToAdminTab(page, "agencies");
    await fillAutocomplete({
      page,
      locator: `#${domElementIds.admin.agencyTab.editAgencyAutocompleteInput}`,
      value: "PE Paris",
    });
    await expect(
      page.locator(`#${domElementIds.admin.agencyTab.agencyUsersTable}`),
    ).toBeVisible();
    await page
      .locator(
        `[id^=${domElementIds.admin.agencyTab.editAgencyUserRoleButton}]`,
      )
      .first()
      .click();
    await expect(
      page.locator(
        `#${domElementIds.admin.agencyTab.editAgencyManageUserModal}`,
      ),
    ).toBeVisible();
    await page
      .locator(
        `[for="${domElementIds.admin.agencyTab.editAgencyManageUserCheckbox}-3"]`,
      )
      .click();
    await page
      .locator(
        `#${domElementIds.admin.agencyTab.editAgencyUserRoleSubmitButton}`,
      )
      .click();
    await expect(page.locator(".fr-alert--success").first()).toBeVisible();
  });
});
