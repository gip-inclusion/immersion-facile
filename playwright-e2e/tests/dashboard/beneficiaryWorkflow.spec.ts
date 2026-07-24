import { expect } from "@playwright/test";
import { domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import {
  goToBeneficiaryDashboardTab,
  goToDashboard,
} from "../../utils/dashboard";
import { expectLocatorToBeVisibleAndEnabled, test } from "../../utils/utils";

test.describe.configure({ mode: "serial" });

test.describe("Beneficiary dashboard workflow", () => {
  test.describe("Beneficiary Convention List with conventions", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test("should be able to navigate to beneficiary convention list and have one convention in list", async ({
      page,
    }) => {
      await page.goto("/");
      await goToDashboard(page, "candidate");
      await expectLocatorToBeVisibleAndEnabled(page.locator(".fr-tabs__list"));
      await goToBeneficiaryDashboardTab(page, "conventions");

      const beneficiaryConventionListTableLocatorId = `#${
        domElementIds.beneficiaryDashboardConventions
          .beneficiaryConventionListTable
      }`;

      await expect(
        page.locator(beneficiaryConventionListTableLocatorId),
      ).toBeVisible();
      await expect(
        page.locator(
          `${beneficiaryConventionListTableLocatorId} table tbody tr`,
        ),
      ).toHaveCount(1);
    });
  });

  test.describe("Beneficiary Convention List without conventions", () => {
    test.use({ storageState: testConfig.establishmentAuthFile });
    test("should be able to navigate to beneficiary convention list and show no convention message", async ({
      page,
    }) => {
      await page.goto("/");
      await goToDashboard(page, "candidate");
      await expectLocatorToBeVisibleAndEnabled(page.locator(".fr-tabs__list"));
      await goToBeneficiaryDashboardTab(page, "conventions");
      await expect(
        page.locator(
          `#${
            domElementIds.beneficiaryDashboardConventions
              .beneficiaryConventionListHelpdeskNoConventionHint
          }`,
        ),
      ).toBeVisible();
    });
  });
});
