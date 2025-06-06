import { type Page, expect } from "@playwright/test";
import {
  type AdminFormEstablishmentUserRight,
  type FormEstablishmentDto,
  addressRoutes,
  domElementIds,
  formCompletionRoutes,
} from "shared";
import { testConfig } from "../../custom.config";
import {
  type PlaywrightTestCallback,
  expectLocatorToBeVisibleAndEnabled,
  expectNoErrorVisible,
  fillAutocomplete,
} from "../../utils/utils";
import {
  type MakeFormEstablishmentFromRetryNumber,
  goToNextStep,
} from "./establishmentForm.utils";

export const createEstablishmentForm =
  (
    makeEstablishment: MakeFormEstablishmentFromRetryNumber,
  ): PlaywrightTestCallback =>
  async ({ page }, { retry }) => {
    const establishment = makeEstablishment(retry);
    const adminRight = establishment.userRights.find(
      (right) => right.role === "establishment-admin",
    );
    if (!adminRight)
      throw new Error("Missing admin right for createNewEstablishment");

    await goToCreateEstablishmentForm(page);

    await step0(page);

    await step1(page, adminRight);

    await step2(page);

    await step3(page);

    await step4(page, establishment);

    await page.waitForTimeout(testConfig.timeForEventCrawler);
  };

export const goToCreateEstablishmentForm = async (page: Page) => {
  await page.goto("/");
  await page.click(`#${domElementIds.home.heroHeader.establishment}`);
  await page.click(
    `#${domElementIds.homeEstablishments.heroHeader.addEstablishmentForm}`,
  );
};

export const step0 = async (page: Page) => {
  const addEstablishmentButton = page.locator(
    `#${domElementIds.establishment.create.startFormButton}`,
  );
  await expectLocatorToBeVisibleAndEnabled(addEstablishmentButton);
  await addEstablishmentButton.click();
};

const step1 = async (
  page: Page,
  adminRight: AdminFormEstablishmentUserRight,
) => {
  const siretInput = await page.locator(
    `#${domElementIds.establishment.create.siret}`,
  );
  await expect(siretInput).toHaveValue("13003013300016");

  await expect(
    page.locator(
      `#${domElementIds.establishment.create.businessContact.firstName}`,
    ),
  ).toHaveValue("Jean");
  await expect(
    page.locator(
      `#${domElementIds.establishment.create.businessContact.lastName}`,
    ),
  ).toHaveValue("Immersion");
  await expect(
    page.locator(
      `#${domElementIds.establishment.create.businessContact.email}`,
    ),
  ).toHaveValue(adminRight.email);

  await page.fill(
    `#${domElementIds.establishment.create.businessContact.job}`,
    adminRight.job,
  );
  await page.fill(
    `#${domElementIds.establishment.create.businessContact.phone}`,
    adminRight.phone,
  );

  await goToNextStep(page, 1, "create");
};

const step2 = async (page: Page) => {
  await expectNoErrorVisible(page);
  await page.click(
    `#${domElementIds.establishment.create.businessAddresses}-add-option-button`,
  );

  await fillAutocomplete({
    page,
    locator: `#${domElementIds.establishment.create.businessAddresses}-1`,
    value: "28 rue des mimosas",
    endpoint: addressRoutes.lookupStreetAddress.url,
  });

  await page.click(
    `#${domElementIds.establishment.create.appellations}-add-option-button`,
  );
  await page.waitForTimeout(5000);
  await fillAutocomplete({
    page,
    locator: `#${domElementIds.establishment.create.appellations}-0`,
    value: "boulang",
    endpoint: formCompletionRoutes.appellation.url,
  });

  await goToNextStep(page, 2, "create");
};

const step3 = async (page: Page) => {
  await expectNoErrorVisible(page);

  const availableRadioLocator = page.locator(
    `[for='${domElementIds.establishment.create.availabilityButton}-1']`,
  );
  const unavailableRadioLocator = page.locator(
    `[for='${domElementIds.establishment.create.availabilityButton}-0']`,
  );
  await expect(availableRadioLocator).not.toBeChecked();
  await expect(unavailableRadioLocator).not.toBeChecked();

  await availableRadioLocator.click();

  await page
    .locator(`[for='${domElementIds.establishment.create.contactMode}-0']`)
    .click();

  await goToNextStep(page, 3, "create");
};

const step4 = async (page: Page, establishment: FormEstablishmentDto) => {
  const summarySiretValue = await page.locator(
    `#${domElementIds.establishment.create.summarySiretValue}`,
  );
  await expect(summarySiretValue).toHaveText("13003013300016");

  const summaryAdminName = await page.locator(
    `#${domElementIds.establishment.create.summaryAdminName}`,
  );
  await expect(summaryAdminName).toContainText("Jean IMMERSION");

  const summaryBusinessAddresses = await page.locator(
    `#${domElementIds.establishment.create.summaryBusinessAddresses} li`,
  );
  await expect(summaryBusinessAddresses).toHaveCount(2);

  const summaryAppellations = await page.locator(
    `#${domElementIds.establishment.create.summaryAppellations} li`,
  );
  await expect(summaryAppellations).toHaveCount(1);

  await page.click(`#${domElementIds.establishment.create.submitFormButton}`);
  await expect(page.url()).toContain(`siret=${establishment.siret}`);
  await expect(page.locator(".fr-alert--success")).toBeVisible();
};
