import { expect, test } from "@playwright/test";
import { domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import { getMagicLinkLocatorFromEmail, goToAdminTab } from "../../utils/admin";

test.describe.configure({ mode: "serial" });

test.describe("Assessment workflow", () => {
  test.use({ storageState: testConfig.adminAuthFile });

  test("Can add an assessment", async ({ page }) => {
    await page.goto("/");
    await goToAdminTab(page, "adminNotifications");

    const magicLinkLocator = await getMagicLinkLocatorFromEmail({
      page,
      emailType: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
      elementIndex: 0,
      label: "assessmentCreationLink",
    });
    await magicLinkLocator.click();

    await expect(
      await page.locator(`#${domElementIds.assessment.statusInput}`),
    ).toBeVisible();

    await page
      .locator(`[for="${domElementIds.assessment.statusInput}-0"]`)
      .click();

    await page
      .locator(
        `#${domElementIds.assessment.nextButtonFromStepAndMode({
          currentStep: 1,
        })}`,
      )
      .click();
    await expect(
      await page.locator(`#${domElementIds.assessment.endedWithAJobInput}`),
    ).toBeVisible();

    await page
      .locator(`[for="${domElementIds.assessment.endedWithAJobInput}-1"]`)
      .click();

    await page
      .locator(
        `#${domElementIds.assessment.nextButtonFromStepAndMode({
          currentStep: 2,
        })}`,
      )
      .click();
    await page
      .locator(`#${domElementIds.assessment.establishmentAdvicesInput}`)
      .fill("test");
    await page
      .locator(`#${domElementIds.assessment.establishmentFeedbackInput}`)
      .fill("test");
    await page.locator(`#${domElementIds.assessment.formSubmitButton}`).click();
    await expect(
      await page.locator(`#${domElementIds.assessment.successMessage}`),
    ).toBeVisible();
  });

  test("Can't fill the form if assessment has already been submitted", async ({
    page,
  }) => {
    await page.goto("/");
    const magicLink = await getMagicLinkLocatorFromEmail({
      page,
      emailType: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
      label: "assessmentCreationLink",
    });
    await magicLink.click();
    await expect(await page.locator(".fr-alert--error")).toBeVisible();
  });
});
