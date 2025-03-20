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
  fillAutocomplete,
} from "../../utils/utils";
import { goToNextStep } from "./establishmentForm.utils";

export const createEstablishmentForm =
  (establishment: FormEstablishmentDto): PlaywrightTestCallback =>
  async ({ page }) => {
    const adminRight = establishment.userRights.find(
      (right) => right.role === "establishment-admin",
    );
    if (!adminRight)
      throw new Error("Missing admin right for createNewEstablishment");

    await goToCreateEstablishmentForm(page);

    await step0(page);

    await step1(page);

    await step2(page);

    await step3(page, adminRight);

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

const step1 = async (page: Page) => {
  const initialRadioButtonLocator = page.locator(
    `#${domElementIds.establishment.create.availabilityButton}`,
  );
  await expect(initialRadioButtonLocator.getByText("Oui")).not.toBeChecked();
  await expect(initialRadioButtonLocator.getByText("Non")).not.toBeChecked();

  await initialRadioButtonLocator.getByText("Oui").click();

  await goToNextStep(page, 1, "create");
};

const step2 = async (page: Page) => {
  await page
    .locator(`[for="${domElementIds.establishment.create.searchableBy}-2"]`) // searchable by students
    .click();

  await goToNextStep(page, 2, "create");
};

const step3 = async (
  page: Page,
  adminRight: AdminFormEstablishmentUserRight,
) => {
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

  await page
    .locator(`[for='${domElementIds.establishment.create.contactMethod}-0']`)
    .click();

  await goToNextStep(page, 3, "create");
};

const step4 = async (page: Page, establishment: FormEstablishmentDto) => {
  await expect(
    page.locator(`#${domElementIds.establishment.create.siret}`),
  ).toHaveValue(establishment.siret);

  await expect(
    page.locator(`#${domElementIds.establishment.create.businessName}`),
  ).toHaveValue("PLATEFORME DE L'INCLUSION");
  await expect(
    page.locator(
      `#${domElementIds.establishment.create.addressAutocomplete}-wrapper .im-select__single-value`,
    ),
  ).toContainText("127 RUE DE GRENELLE 75007 PARIS");
  await expect(
    await page
      .locator(`#${domElementIds.establishment.create.businessAddresses}-0`)
      .inputValue(),
  ).toContain(establishment.businessAddresses[0].rawAddress.toUpperCase());

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

  await page.click(`#${domElementIds.establishment.create.submitFormButton}`);
  await expect(page.url()).toContain(`siret=${establishment.siret}`);
  await expect(page.locator(".fr-alert--success")).toBeVisible();
};
