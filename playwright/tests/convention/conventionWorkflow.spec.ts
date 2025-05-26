import { faker } from "@faker-js/faker";
import test, { expect } from "@playwright/test";
import { domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import {
  getMagicLinkFromEmail,
  getMagicLinkLocatorFromEmail,
  goToAdminTab,
} from "../../utils/admin";
import {
  type ConventionSubmitted,
  allOtherSignatoriesSignConvention,
  signConvention,
  submitBasicConventionForm,
  submitEditConventionForm,
  tomorrowDateDisplayed,
  updatedEndDateDisplayed,
} from "../../utils/convention";

test.describe.configure({ mode: "serial" });

test.describe("Convention creation and modification workflow", () => {
  let conventionSubmitted: ConventionSubmitted | void;

  test("creates a new convention", async ({ page }) => {
    conventionSubmitted = await submitBasicConventionForm(page);
    await page.waitForTimeout(testConfig.timeForEventCrawler);
  });

  test.describe("Convention admin get notifications magic links", () => {
    test.use({ storageState: testConfig.adminAuthFile });

    test.describe("convention initial signatures before modification", () => {
      const signatoriesCount = 2;
      const signatoriesMagicLinks: string[] = [];

      test("get signatories magicLink urls from email", async ({ page }) => {
        await page.goto("/");
        await goToAdminTab(page, "adminNotifications");
        for (let index = 0; index < signatoriesCount; index++) {
          const href = await getMagicLinkFromEmail({
            page,
            emailType: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
            elementIndex: index,
            label: "conventionSignShortlink",
          });
          if (href) {
            signatoriesMagicLinks.push(href);
          }
        }
        await expect(signatoriesMagicLinks.length).toBe(signatoriesCount);
      });

      test("first two signatories signs the convention", async ({ page }) => {
        await signConvention(
          page,
          signatoriesMagicLinks[0],
          tomorrowDateDisplayed,
        );
      });

      test.describe("last signatory signs convention from Martinique", () => {
        test.use({
          timezoneId: "America/Martinique",
        });
        test("signs convention for signatory 4", async ({ page }) => {
          await signConvention(
            page,
            signatoriesMagicLinks[1],
            tomorrowDateDisplayed,
          );
        });
      });
    });

    test.describe("convention modification adding other signatories", () => {
      test.use({
        timezoneId: "Europe/Paris",
      });

      test("validator does the modification", async ({ page }) => {
        await page.goto("/");
        const validatorMagicLinkLocator = await getMagicLinkLocatorFromEmail({
          page,
          emailType: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          elementIndex: 0,
        });
        await validatorMagicLinkLocator.click();

        await page
          .locator(`#${domElementIds.manageConvention.editActionsButton}`)
          .click();
        await page
          .locator(`#${domElementIds.manageConvention.editLink}`)
          .click();

        await expect(
          page.locator(
            `#${domElementIds.conventionImmersionRoute.form({
              internshipKind: "immersion",
              mode: "edit",
            })}`,
          ),
        ).toBeVisible();

        await submitEditConventionForm(page, conventionSubmitted);
      });

      test("then first signatory also edit the convention (his submission also signs the convention)", async ({
        page,
      }) => {
        await page.goto("/");
        await goToAdminTab(page, "adminNotifications");

        const magicLinkLocator = await getMagicLinkLocatorFromEmail({
          page,
          emailType:
            "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION",
          elementIndex: 0,
          label: "conventionSignShortlink",
        });
        await magicLinkLocator.click();

        await page
          .locator(`#${domElementIds.conventionToSign.modificationButton}`)
          .click();
        await expect(
          page.locator(
            `#${domElementIds.conventionImmersionRoute.form({
              internshipKind: "immersion",
              mode: "edit",
            })}`,
          ),
        ).toBeVisible();

        await page
          .locator(
            `#${domElementIds.conventionImmersionRoute.submitFormButton}`,
          )
          .click();

        await page.fill(
          `#${domElementIds.conventionImmersionRoute.statusJustificationInput}`,
          "justification de la modification",
        );

        await page.click(
          `#${domElementIds.conventionToSign.openSignModalButton}`,
        );

        await page.click(`#${domElementIds.conventionToSign.submitButton}`);
        await expect(page.locator(".fr-alert--success")).toBeVisible();
      });
    });

    test.describe("convention signatures after modification", () => {
      test("all other signatories sign the convention", async ({ page }) => {
        await allOtherSignatoriesSignConvention({
          page,
          expectedConventionEndDate: updatedEndDateDisplayed,
        });
      });
    });

    test.describe("convention review and validation", () => {
      test("reviews and validate convention", async ({ page }) => {
        await page.goto("/");
        const href = await getMagicLinkFromEmail({
          page,
          emailType: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
          elementIndex: 0,
        });
        expect(href).not.toBe(null);
        if (!href)
          throw new Error("Convention validation magic link not found");
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
