import test, { expect, Page } from "@playwright/test";
import { domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import { goToAdminTab } from "../../utils/admin";
import { fillAutocomplete } from "../../utils/utils";

test.describe.configure({ mode: "serial" });

const goToMyProfilePage = async (page: Page) => {
  await page.locator("#fr-header-quick-access-item-1").click();
  await page
    .locator(`#${domElementIds.header.navLinks.quickAccess.myAccount}`)
    .click();
};

test.describe("User workflow", () => {
  test.describe("Backoffice admin can go to MyProfile page", () => {
    test.use({ storageState: testConfig.adminAuthFile });

    test("can access infos on MyProfile page", async ({ page }) => {
      await page.goto("/");
      await goToMyProfilePage(page);

      await expect(
        page.locator(`#${domElementIds.profile.firstName}`),
      ).toHaveText("Prénom : Prénom Admin");
      await expect(
        page.locator(`#${domElementIds.profile.lastName}`),
      ).toHaveText("Nom : Nom Admin");
      await expect(page.locator(`#${domElementIds.profile.email}`)).toHaveText(
        "Email : admin+playwright@immersion-facile.beta.gouv.fr",
      );
      const agenciesCount = await page
        .locator(`[id^=${domElementIds.profile.editRoleButton}]`)
        .count();
      await expect(
        page.locator(`[id^=${domElementIds.profile.adminAgencyLink}]`),
      ).toHaveCount(agenciesCount);

      await page
        .locator(`[id^=${domElementIds.profile.editRoleButton}]`)
        .first()
        .click();
      await expect(
        page.locator(
          `#${domElementIds.admin.agencyTab.editAgencyManageUserModal}`,
        ),
      ).toBeVisible();
      await expect(
        page.locator(`#${domElementIds.profile.editAgencyUserEmail}`),
      ).toBeDisabled();
      await page
        .locator(
          `[for="${domElementIds.profile.editAgencyManageUserCheckbox}-3"]`,
        )
        .click();
      await page
        .locator(`#${domElementIds.profile.editAgencyUserRoleSubmitButton}`)
        .click();
      await expect(page.locator(".fr-alert--success").first()).toBeVisible();
    });

    test("create a user with agency-admin and validator rights for agency", async ({
      page,
    }) => {
      await page.goto("/");
      await goToAdminTab(page, "adminAgencies");

      await fillAutocomplete({
        page,
        locator: `#${domElementIds.admin.agencyTab.editAgencyAutocompleteInput}`,
        value: "PE Paris",
      });

      await page
        .locator(
          `[id^=${domElementIds.admin.agencyTab.openManageUserModalButton}]`,
        )
        .click();

      await expect(
        page.locator(
          `#${domElementIds.admin.agencyTab.editAgencyManageUserModal}`,
        ),
      ).toBeVisible();
      await page.fill(
        `#${domElementIds.admin.agencyTab.editAgencyUserEmail}`,
        "recette+playwright@immersion-facile.beta.gouv.fr",
      );
      await page
        .locator(
          `[for="${domElementIds.admin.agencyTab.editAgencyManageUserCheckbox}-0"]`,
        )
        .click();
      await page
        .locator(
          `[for="${domElementIds.admin.agencyTab.editAgencyManageUserCheckbox}-1"]`,
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

  test.describe("Agency-admin user can go to MyProfile page", () => {
    test.use({ storageState: testConfig.agencyAuthFile });

    test("can access infos on MyProfile page", async ({ page }) => {
      await page.goto("/");
      await goToMyProfilePage(page);

      await expect(page.locator(`#${domElementIds.profile.email}`)).toHaveText(
        "Email : recette+playwright@immersion-facile.beta.gouv.fr",
      );
      await expect(
        page.locator(`[id^=${domElementIds.profile.adminAgencyLink}]`),
      ).toHaveCount(0);
      await expect(
        page.locator(`[id^=${domElementIds.profile.editRoleButton}]`).first(),
      ).toBeVisible();
    });

    test("can remove its own agency-admin right", async ({ page }) => {
      await page.goto("/");
      await goToMyProfilePage(page);

      await page
        .locator("tr")
        .filter({ hasText: "PE Paris" })
        .locator(`[id^=${domElementIds.profile.editRoleButton}]`)
        .click();
      await expect(
        page.locator(
          `#${domElementIds.admin.agencyTab.editAgencyManageUserModal}`,
        ),
      ).toBeVisible();
      await expect(
        page.locator(`#${domElementIds.profile.editAgencyUserEmail}`),
      ).toBeDisabled();
      await page
        .locator(
          `[for="${domElementIds.profile.editAgencyManageUserCheckbox}-0"]`,
        )
        .click();
      await page
        .locator(`#${domElementIds.profile.editAgencyUserRoleSubmitButton}`)
        .click();
      await expect(page.locator(".fr-alert--success").first()).toBeVisible();
    });
  });

  test.describe("Basic agency user can go to MyProfile page", () => {
    test.use({ storageState: testConfig.agencyAuthFile });

    test("can access infos on MyProfile page", async ({ page }) => {
      await page.goto("/");
      await goToMyProfilePage(page);

      await expect(
        page.locator(`#${domElementIds.profile.firstName}`),
      ).toHaveText("Prénom : Test e2e");
      await expect(
        page.locator(`#${domElementIds.profile.lastName}`),
      ).toHaveText("Nom : Immersion Facilitée");
      await expect(page.locator(`#${domElementIds.profile.email}`)).toHaveText(
        "Email : recette+playwright@immersion-facile.beta.gouv.fr",
      );
      await expect(
        page.locator(`#${domElementIds.profile.updateOwnInfosLink}`),
      ).toBeVisible();
      await expect(
        page.locator(`[id^=${domElementIds.profile.adminAgencyLink}]`),
      ).toHaveCount(0);
    });

    test("has access to his notification preferences", async ({ page }) => {
      await page.goto("/");
      await goToMyProfilePage(page);

      await page
        .locator(`[id^=${domElementIds.profile.editRoleButton}]`)
        .first()
        .click();
      await expect(
        page.locator(
          `#${domElementIds.admin.agencyTab.editAgencyManageUserModal}`,
        ),
      ).toBeVisible();
      await expect(
        page.locator(`#${domElementIds.profile.editAgencyUserEmail}`),
      ).toBeDisabled();
      const roleOptionsCount = await page
        .locator(
          `input[id^=${domElementIds.profile.editAgencyManageUserCheckbox}]`,
        )
        .count();

      for (let i = 0; i < roleOptionsCount; i++) {
        await expect(
          page.locator(
            `[for="${domElementIds.profile.editAgencyManageUserCheckbox}-${i}"]`,
          ),
        ).toBeDisabled();
      }

      await expect(
        page.locator(
          `#${domElementIds.profile.editAgencyUserIsNotifiedByEmail}`,
        ),
      ).toBeEnabled();
    });
  });

  test.describe("Reset", () => {
    test.use({ storageState: testConfig.adminAuthFile });

    test("Remove new user from agency", async ({ page }) => {
      await page.goto("/");

      await goToAdminTab(page, "adminAgencies");

      await fillAutocomplete({
        page,
        locator: `#${domElementIds.admin.agencyTab.editAgencyAutocompleteInput}`,
        value: "PE Paris",
      });

      await page
        .locator("tr")
        .filter({ hasText: "recette+playwright@immersion-facile.beta.gouv.fr" })
        .locator(
          `[id^=${domElementIds.admin.agencyTab.editAgencyRemoveUserButton}]`,
        )
        .click();

      await expect(
        page.locator(
          `#${domElementIds.admin.agencyTab.editAgencyRemoveUserModal}`,
        ),
      ).toBeVisible();

      await page
        .locator(
          `[id^=${domElementIds.admin.agencyTab.editAgencyRemoveUserConfirmationButton}]`,
        )
        .click();

      await expect(page.locator(".fr-alert--success").first()).toBeVisible();
    });
  });
});
