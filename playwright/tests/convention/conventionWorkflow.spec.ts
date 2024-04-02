import { faker } from "@faker-js/faker";
import test, { expect } from "@playwright/test";
import { domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import {
  connectToAdmin,
  getMagicLinkInEmailWrapper,
  openEmailInAdmin,
} from "../../utils/admin";
import {
  signConvention,
  submitBasicConventionForm,
  submitEditConventionForm,
} from "../../utils/convention";

test.describe.configure({ mode: "serial" });

test.describe("Convention creation and modification workflow", () => {
  const magicLinks: string[] = [];

  test("creates a new convention", async ({ page }) => {
    await submitBasicConventionForm(page);
    await page.waitForTimeout(testConfig.timeForEventCrawler);
  });

  test("get signatories magicLink urls from email", async ({ page }) => {
    const maxEmails = 2;
    await connectToAdmin(page);
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
    await signConvention(page, magicLinks[0]);
    await connectToAdmin(page);
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
      .locator(
        `#${domElementIds.manageConvention.conventionValidationRequestEditButton}`,
      )
      .click();
    await page
      .locator(`#${domElementIds.manageConvention.draftModal}`)
      .getByRole("button", { name: "Il y un autre problème sur le" })
      .click();

    await page.selectOption(
      `#${domElementIds.manageConvention.modifierRoleSelect}`,
      "beneficiary",
    );
    await page
      .locator(
        `#${domElementIds.manageConvention.draftModal} [name="statusJustification"]`,
      )
      .fill("Justification");
    await page
      .locator(
        `#${domElementIds.manageConvention.justificationModalSubmitButton}`,
      )
      .click();
    await expect(page.locator(".fr-alert--success")).toBeVisible();
    await page.waitForTimeout(testConfig.timeForEventCrawler);
  });

  test("signatory edit the convention and re-submit it", async ({ page }) => {
    await connectToAdmin(page);
    const emailWrapper = await openEmailInAdmin(
      page,
      "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
      0,
    );
    const href = await getMagicLinkInEmailWrapper(emailWrapper);
    expect(href).not.toBe(null);

    if (!href) return;

    await page.goto(href);
    await submitEditConventionForm(page, href);
  });

  test.describe("signs convention for signatories", () => {
    const signatoriesMagicLinks: string[] = [];
    const signatories = 4;

    test("get signatories magicLink urls from email", async ({ page }) => {
      await connectToAdmin(page);
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
      await signConvention(page, signatoriesMagicLinks[0]);
    });

    test("signs convention for signatory 2", async ({ page }) => {
      await signConvention(page, signatoriesMagicLinks[1]);
    });

    test("signs convention for signatory 3", async ({ page }) => {
      await signConvention(page, signatoriesMagicLinks[2]);
    });

    test("signs convention for signatory 4", async ({ page }) => {
      await signConvention(page, signatoriesMagicLinks[3]);
      await page.waitForTimeout(testConfig.timeForEventCrawler);
    });

    test("reviews and validate convention", async ({ page }) => {
      await connectToAdmin(page);
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
