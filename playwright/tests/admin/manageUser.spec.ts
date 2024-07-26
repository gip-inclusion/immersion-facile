import { expect, test } from "@playwright/test";
import { domElementIds } from "shared";
import { goToAdminTab } from "../../utils/admin";
import { fillAutocomplete } from "../../utils/utils";

test.describe("Manage users in admin", () => {
  test("Can edit roles of a user", async ({ page }) => {
    await goToAdminTab(page, "agencies");
    await fillAutocomplete({
      page,
      locator: `#${domElementIds.admin.agencyTab.editAgencyAutocompleteInput}`,
      value: "Agence cap-emploi Paris",
    });
    await expect(
      page.locator(`#${domElementIds.admin.agencyTab.agencyUsersTable}`),
    ).toBeVisible();
    await page.getByRole("button", { name: "Modifier" }).click();
    await expect(page.locator("#im-manage-user-modal")).toBeVisible();
    await expect(
      page.locator("#admin-agency-user-table-modal-checkbox"),
    ).toBeVisible();
    await page
      .locator('label[for="admin-agency-user-table-modal-checkbox-3"]')
      .click();
    await page
      .locator('label[for="admin-agency-user-table-modal-checkbox-4"]')
      .click();
    await page.getByRole("button", { name: "Valider" }).click();
    await expect(page.locator(".fr-alert--success").first()).toBeVisible();
  });
});
