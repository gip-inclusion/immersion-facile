import { faker } from "@faker-js/faker";
import test, { expect } from "@playwright/test";
import { domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import {
  getMagicLinkInEmailWrapper,
  goToAdminTab,
  openEmailInAdmin,
} from "../../utils/admin";
import {
  type ConventionSubmitted,
  signConvention,
  submitBasicConventionForm,
  submitEditConventionForm,
  tomorrowDateDisplayed,
  updatedEndDateDisplayed,
} from "../../utils/convention";

test.describe.configure({ mode: "serial" });

test.describe("Convention creation and modification workflow", () => {
  const magicLinks: string[] = [];
  let conventionSubmitted: ConventionSubmitted | void;

  test("creates a new convention", async ({ page }) => {
    conventionSubmitted = await submitBasicConventionForm(page);
    await page.waitForTimeout(testConfig.timeForEventCrawler);
  });

  test.describe("Convention admin get notifications magic links", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test("get signatories magicLink urls from email", async ({ page }) => {
      const maxEmails = 2;
      await page.goto("/");
      await goToAdminTab(page, "adminNotifications");
      for (let index = 0; index < maxEmails; index++) {
        const emailWrapper = await openEmailInAdmin(
          page,
          "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
          index,
        );
        const href = await getMagicLinkInEmailWrapper(
          emailWrapper,
          "conventionSignShortlink",
        );
        if (href) {
          magicLinks.push(href);
        }
      }
      await expect(magicLinks.length).toBe(maxEmails);
    });
    test("signs convention for first signatory and validator requires modification", async ({
      page,
    }) => {
      await signConvention(page, magicLinks, 0, tomorrowDateDisplayed);
      await goToAdminTab(page, "adminNotifications");
      const emailWrapper = await openEmailInAdmin(
        page,
        "NEW_CONVENTION_AGENCY_NOTIFICATION",
        0,
      );
      await emailWrapper
        .locator("li")
        .filter({
          hasText: "magicLink",
        })
        .getByRole("link")
        .click();
      await page
        .locator(`#${domElementIds.manageConvention.editActionsButton}`)
        .click();
      await page
        .locator(`#${domElementIds.manageConvention.requestEditButton}`)
        .click();

      await page.selectOption(
        `#${domElementIds.manageConvention.modifierRoleSelect}`,
        "beneficiary",
      );
      await page
        .locator(
          `#${domElementIds.manageConvention.requestEditModal} [name="statusJustification"]`,
        )
        .fill("Justification");
      await page
        .locator(`#${domElementIds.manageConvention.requestEditSubmitButton}`)
        .click();
      await expect(page.locator(".fr-alert--success")).toBeVisible();
      await page.waitForTimeout(testConfig.timeForEventCrawler);
    });
    test("signatory edit the convention and re-submit it", async ({ page }) => {
      await page.goto("/");
      await goToAdminTab(page, "adminNotifications");
      const emailWrapper = await openEmailInAdmin(
        page,
        "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
        0,
      );
      const href = await getMagicLinkInEmailWrapper(emailWrapper);
      expect(href).not.toBe(null);

      if (!href) return;

      await page.goto(href);
      await submitEditConventionForm(page, href, conventionSubmitted);
    });
    test.describe("signs convention for signatories", () => {
      const signatoriesMagicLinks: string[] = [];
      const signatories = 4;

      test("get signatories magicLink urls from email", async ({ page }) => {
        await page.goto("/");
        for (let index = 0; index < signatories; index++) {
          const emailWrapper = await openEmailInAdmin(
            page,
            "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
            index,
          );
          const href = await getMagicLinkInEmailWrapper(
            emailWrapper,
            "conventionSignShortlink",
          );
          if (href) {
            signatoriesMagicLinks.push(href);
          }
        }
        await expect(signatoriesMagicLinks.length).toBe(signatories);
      });

      test("signs convention for signatory 1", async ({ page }) => {
        await signConvention(
          page,
          signatoriesMagicLinks,
          0,
          updatedEndDateDisplayed,
        );
      });

      test("signs convention for signatory 2", async ({ page }) => {
        await signConvention(
          page,
          signatoriesMagicLinks,
          1,
          updatedEndDateDisplayed,
        );
      });
      test("signs convention for signatory 3", async ({ page }) => {
        await signConvention(
          page,
          signatoriesMagicLinks,
          2,
          updatedEndDateDisplayed,
        );
      });
      test.describe("last signatory signs convention from Martinique", () => {
        test.use({
          timezoneId: "America/Martinique",
        });
        test("signs convention for signatory 4", async ({ page }) => {
          await signConvention(
            page,
            signatoriesMagicLinks,
            3,
            updatedEndDateDisplayed,
          );
        });
      });
    });

    test.describe("Convention validation", () => {
      test.use({
        timezoneId: "Europe/Paris",
      });
      test("reviews and validate convention", async ({ page }) => {
        await page.goto("/");
        await goToAdminTab(page, "adminNotifications");
        const emailWrapper = await openEmailInAdmin(
          page,
          "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
          0,
        );
        const href = await getMagicLinkInEmailWrapper(emailWrapper);
        expect(href).not.toBe(null);
        if (!href) return;
        await page.goto(href);
        await page
          .locator(
            `#${domElementIds.manageConvention.conventionValidationValidateButton}`,
          )
          .click();
        await page
          .locator(
            `#${domElementIds.manageConvention.validatorModalLastNameInput}`,
          )
          .fill(faker.person.lastName());
        await page
          .locator(
            `#${domElementIds.manageConvention.validatorModalFirstNameInput}`,
          )
          .fill(faker.person.firstName());
        await page
          .locator(
            `#${domElementIds.manageConvention.validatorModalSubmitButton}`,
          )
          .click();
        await expect(page.locator(".fr-alert--success")).toBeVisible();
      });
    });
  });
});

test.describe("Convention creation and modification workflow in Martinique", () => {
  test.use({
    timezoneId: "America/Martinique",
  });
  test("creates a new convention on a client in Martinique", async ({
    page,
  }) => {
    await submitBasicConventionForm(page);
  });
});
