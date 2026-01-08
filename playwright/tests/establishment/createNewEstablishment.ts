import { expect, type Page } from "@playwright/test";
import {
  type AdminFormEstablishmentUserRight,
  addressRoutes,
  domElementIds,
  type FormEstablishmentDto,
  formCompletionRoutes,
} from "shared";
import { testConfig } from "../../custom.config";
import {
  expectNoErrorVisible,
  fillAutocomplete,
  type PlaywrightTestCallback,
} from "../../utils/utils";
import {
  goToNextStep,
  type MakeFormEstablishmentFromRetryNumber,
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

    await step1(page, adminRight, establishment);

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

const step1 = async (
  page: Page,
  adminRight: AdminFormEstablishmentUserRight,
  establishment: FormEstablishmentDto,
) => {
  const siretInput = await page.locator(
    `#${domElementIds.establishment.create.siret}`,
  );

  await siretInput.fill(establishment.siret);

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

  await addOffer(page, "boulang", "fullRemote");

  await editOffer(page, 0, "hybrid");

  await addOffer(page, "routage", "fullRemote");

  await addLocation(page);

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

  await page
    .locator(
      `[for='${domElementIds.establishment.create.businessContact.isMainContactByPhone}-0']`,
    )
    .click();

  await goToNextStep(page, 3, "create");
};

const step4 = async (page: Page, establishment: FormEstablishmentDto) => {
  const summarySiretValue = await page.locator(
    `#${domElementIds.establishment.create.summarySiretValue}`,
  );
  await expect(summarySiretValue).toHaveText(establishment.siret);

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
  await expect(summaryAppellations).toHaveCount(2);

  await page.click(`#${domElementIds.establishment.create.submitFormButton}`);
  await expect(page.locator(".fr-alert--success")).toBeVisible();
};

type RemoteMode = "hybrid" | "fullRemote" | "onsite";
const remoteModeIndexMap: Record<RemoteMode, number> = {
  hybrid: 0,
  fullRemote: 1,
  onsite: 2,
};

const addOffer = async (
  page: Page,
  appelationValue: string,
  remoteMode: RemoteMode,
) => {
  await page.click(`#${domElementIds.establishment.create.addOfferButton}`);

  await fillAutocomplete({
    page,
    locator: `#${domElementIds.establishment.create.appellations}`,
    value: appelationValue,
    endpoint: formCompletionRoutes.appellation.url,
  });

  await page.click(
    `[for='${domElementIds.establishment.create.remoteWorkMode}-${remoteModeIndexMap[remoteMode]}']`,
  );

  await page.click(`#${domElementIds.establishment.offerModalSubmitButton}`);
};

const editOffer = async (
  page: Page,
  offerIndex: number,
  remoteMode: RemoteMode,
) => {
  await page.click(
    `#${domElementIds.establishment.create.editOfferButton}-${offerIndex}`,
  );
  await page.click(
    `[for='${domElementIds.establishment.create.remoteWorkMode}-${remoteModeIndexMap[remoteMode]}']`,
  );

  await page.click(`#${domElementIds.establishment.offerModalSubmitButton}`);
};

const addLocation = async (page: Page) => {
  await page.click(
    `#${domElementIds.establishment.create.businessAddresses}-add-option-button`,
  );

  await fillAutocomplete({
    page,
    locator: `#${domElementIds.establishment.create.businessAddresses}-1`,
    value: "28 rue des mimosas",
    endpoint: addressRoutes.lookupStreetAddress.url,
  });
  await page.waitForTimeout(2000);
};
