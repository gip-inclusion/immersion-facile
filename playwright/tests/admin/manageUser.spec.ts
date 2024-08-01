import { expect, test } from "@playwright/test";
import { domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import { goToAdminTab } from "../../utils/admin";
import { fillAutocomplete } from "../../utils/utils";

test.describe("Manage users in admin", () => {
  test.use({ storageState: testConfig.adminAuthFile });
  test("Can edit roles of a user", async ({ page }) => {
    await page.goto("/");
    await goToAdminTab(page, "agencies");
    await fillAutocomplete({
      page,
      locator: `#${domElementIds.admin.agencyTab.editAgencyAutocompleteInput}`,
      value: "PE Paris",
    });
    await expect(
      page.locator(`#${domElementIds.admin.agencyTab.editAgencyUsersTable}`),
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
        `[for="${domElementIds.admin.agencyTab.editAgencyManageUserCheckbox}-4"]`,
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
