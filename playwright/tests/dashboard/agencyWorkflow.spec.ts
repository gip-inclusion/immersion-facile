import test, { expect } from "@playwright/test";
import { AgencyId, domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import { connectToAdmin, goToAdminTab } from "../../utils/admin";
import { loginWithInclusionConnect } from "../../utils/inclusionConnect";
import { fillAutocomplete } from "../../utils/utils";
import { fillAndSubmitBasicAgencyForm } from "../agency/agencyWorkflow.spec";

test.describe("Agency dashboard workflow", () => {
  let agencyId: AgencyId | null;
  test("should be able to register a new agency for the user", async ({
    page,
  }) => {
    agencyId = await fillAndSubmitBasicAgencyForm(page);
    console.info("Added agency ID: ", agencyId);
    if (!agencyId) throw new Error("Agency ID is null");
    console.info("connectToAdmin 1");
    await connectToAdmin(page);
    console.info("goToAdminTab 1");
    await goToAdminTab(page, "agencies");
    await page
      .locator(`#${domElementIds.admin.agencyTab.agencyToReviewInput}`)
      .fill(agencyId);
    await page
      .locator(`#${domElementIds.admin.agencyTab.agencyToReviewButton}`)
      .click();
    await page.waitForSelector(
      `#${domElementIds.admin.agencyTab.agencyToReviewActivateButton}`,
    );
    await page
      .locator(`#${domElementIds.admin.agencyTab.agencyToReviewActivateButton}`)
      .click();

    await expect(
      await page.locator(".fr-alert--success").first(),
    ).toBeVisible();
    await page.waitForTimeout(testConfig.timeForEventCrawler);
    await loginWithInclusionConnect(page, "agencyDashboard");
    expect(
      await page.locator(
        `#${domElementIds.agencyDashboard.registerAgencies.form}`,
      ),
    ).toBeVisible();
    await fillAutocomplete({
      page,
      locator: `#${domElementIds.agencyDashboard.registerAgencies.agencyAutocomplete}--0`,
      value: "Cap emploi",
    });
    await page
      .locator(
        `#${domElementIds.agencyDashboard.registerAgencies.submitButton}`,
      )
      .click();

    await expect(
      await page.locator(".fr-alert--success").first(),
    ).toBeVisible();
    console.info("goToAdminTab 2");
    await goToAdminTab(page, "agencies");
    await page
      .locator(`#${domElementIds.admin.agencyTab.selectIcUserToReview}`)
      .selectOption({
        index: 1,
      });
    await page
      .locator(
        `[id^=${domElementIds.admin.agencyTab.registerIcUserToAgencyButton}]`,
      )
      .click();
  });
  test("IC user can access to the agency dashboard", async ({ page }) => {
    await loginWithInclusionConnect(page, "agencyDashboard");
    await expect(
      await page.locator(
        `#${domElementIds.agencyDashboard.dashboard.tabContainer}`,
      ),
    ).toBeVisible();
  });
});
