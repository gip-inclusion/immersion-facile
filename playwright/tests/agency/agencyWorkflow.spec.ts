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
  const makeAgencyOverride = (seed: string) => ({
    customizedName: `Cap emploi de Bayonne ${seed}`,
    validatorEmail: `valideur+${seed}@cap.com`,
    agencyContactEmail: `contact+${seed}@cap.com`,
  });

  test.describe("Agency creation", () => {
    test.use({ storageState: testConfig.agencyAuthFile });

    test("Can add an agency (prescripteur), with one step of validators", async ({
      page,
    }) => {
      const seed = `agency-creation-r${test.info().retry}`;
      agencyAddedId = await fillAndSubmitBasicAgencyForm(
        page,
        makeAgencyOverride(seed),
      );
      await expect(
        page
          .locator(".fr-alert--success")
          .or(page.locator(".fr-alert--error").filter({ hasText: /existe/i })),
      ).toBeVisible();
    });

    test("Cannot add a second agency with same data", async ({ page }) => {
      const seed = `agency-duplicate-r${test.info().retry}`;
      const override = makeAgencyOverride(seed);
      await fillAndSubmitBasicAgencyForm(page, override);
      await fillAndSubmitBasicAgencyForm(page, override);
      await expect(page.locator(".fr-alert--error")).toBeVisible();
    });
  });

  test.describe("Agency rejection in admin", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test("Rejects an agency in backoffice", async ({ page }) => {
      if (!agencyAddedId) throw new Error("agencyAddedId is null");
      await rejectAgencyInAdmin(page, agencyAddedId);
    });
  });
});
