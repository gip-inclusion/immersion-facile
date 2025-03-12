import { expect, test } from "@playwright/test";
import type { AgencyId } from "shared";
import { testConfig } from "../../custom.config";
import {
  fillAndSubmitBasicAgencyForm,
  rejectAgencyInAdmin,
} from "../../utils/agency";

test.describe.configure({ mode: "serial" });

test.describe("Agency workflow", () => {
  let agencyAddedId: AgencyId | null = null;

  test("Can add an agency (prescripteur), with one step of validators", async ({
    page,
  }) => {
    agencyAddedId = await fillAndSubmitBasicAgencyForm(page);
    await expect(page.locator(".fr-alert--success")).toBeVisible();
  });

  test("Cannot add a second agency with same data", async ({ page }) => {
    await fillAndSubmitBasicAgencyForm(page);
    await expect(page.locator(".fr-alert--error")).toBeVisible();
  });
  test.describe("Agency rejection in admin", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test("Rejects an agency in backoffice", async ({ page }) => {
      if (!agencyAddedId) throw new Error("agencyAddedId is null");
      await rejectAgencyInAdmin(page, agencyAddedId);
    });
  });
});
