import { Page, PlaywrightTestArgs, TestInfo, expect } from "@playwright/test";
import {
  BusinessContactDto,
  DateTimeIsoString,
  FormEstablishmentAddress,
  FormEstablishmentDto,
  domElementIds,
} from "shared";
import { testConfig } from "../../custom.config";
import { goToAdminTab } from "../../utils/admin";
import {
  expectLocatorToBeReadOnly,
  expectLocatorToBeVisibleAndEnabled,
  fillAutocomplete,
} from "../../utils/utils";
import {
  EstablishmentsRetries,
  closeModal,
  goToNextStep,
} from "./establishmentForm.utils";
import { goToManageEtablishmentBySiretInAdmin } from "./establishmentNavigation.utils";

export const modifyEstablishmentMagicLink =
  (
    updatedEstablishmentInfos: Partial<FormEstablishmentDto>,
    establishmentRetries: EstablishmentsRetries,
  ) =>
  async ({ page }: PlaywrightTestArgs, { retry }: TestInfo): Promise<void> => {
    await getEditLinkThroughAdmin(page, retry, establishmentRetries);

    await editEstablishmentWithStepForm(
      page,
      retry,
      updatedEstablishmentInfos,
      establishmentRetries,
    );
  };

export const updateEstablishmentBackOfficeAdmin =
  (establishmentRetries: EstablishmentsRetries) =>
  async ({ page }: PlaywrightTestArgs, { retry }: TestInfo): Promise<void> => {
    await goToManageEtablishmentBySiretInAdmin(
      page,
      retry,
      establishmentRetries,
    );

    await page
      .locator(`#${domElementIds.establishment.admin.availabilityButton}`)
      .getByText("Oui")
      .click();
    await page.click(`#${domElementIds.establishment.admin.submitFormButton}`);
    await expect(page.locator(".fr-alert--success")).toBeVisible();
  };

const getEditLinkThroughAdmin = async (
  page: Page,
  retry: number,
  establishmentRetries: EstablishmentsRetries,
): Promise<void> => {
  await page.goto("/");
  await page.click(`#${domElementIds.home.heroHeader.establishment}`);
  await page.click(
    `#${domElementIds.homeEstablishments.heroHeader.addEstablishmentForm}`,
  );
  await page.fill(
    `#${domElementIds.homeEstablishments.siretModal.siretFetcherInput}`,
    establishmentRetries[retry].siret,
  );

  await expectLocatorToBeVisibleAndEnabled(
    await page.locator(
      `#${domElementIds.homeEstablishments.siretModal.editEstablishmentButton}`,
    ),
  );

  await page.click(
    `#${domElementIds.homeEstablishments.siretModal.editEstablishmentButton}`,
  );
  await page.waitForTimeout(testConfig.timeForEventCrawler);
  await closeModal(page);
  // Go to admin page / go to notifications tab
  await goToAdminTab(page, "adminNotifications");
  const emailWrapper = page
    .locator(".fr-accordion:has-text('EDIT_FORM_ESTABLISHMENT_LINK')")
    .first();
  await emailWrapper.click();
  await emailWrapper.getByRole("link", { name: "Lien vers la page" }).click();

  await page.waitForTimeout(4000);
};

const editEstablishmentWithStepForm = async (
  page: Page,
  retry: number,
  updatedEstablishmentInfos: Partial<FormEstablishmentDto>,
  establishmentRetries: EstablishmentsRetries,
): Promise<void> => {
  const businessContact = updatedEstablishmentInfos.businessContact;
  if (!businessContact)
    throw new Error("Missing business contact for updatedEstablishmentInfos");
  const nextAvailabilityDate = updatedEstablishmentInfos.nextAvailabilityDate;
  if (!nextAvailabilityDate)
    throw new Error(
      "Missing next availability date for updatedEstablishmentInfos",
    );
  const maxContactsPerMonth = updatedEstablishmentInfos.maxContactsPerMonth;
  if (!maxContactsPerMonth)
    throw new Error(
      "Missing max contacts per month for updatedEstablishmentInfos",
    );

  const businessAddress = updatedEstablishmentInfos.businessAddresses
    ? updatedEstablishmentInfos.businessAddresses[0]
    : undefined;
  if (!businessAddress)
    throw new Error(
      "Missing first business address for updatedEstablishmentInfos",
    );

  const businessNameCustomized =
    updatedEstablishmentInfos.businessNameCustomized;
  if (!businessNameCustomized)
    throw new Error(
      "Missing business name customized for updatedEstablishmentInfos",
    );

  const additionalInformation = updatedEstablishmentInfos.additionalInformation;
  if (!additionalInformation)
    throw new Error(
      "Missing additional information for updatedEstablishmentInfos",
    );

  const website = updatedEstablishmentInfos.website;
  if (!website)
    throw new Error("Missing website for updatedEstablishmentInfos");

  await start(page);
  await step1Availability(page, nextAvailabilityDate, maxContactsPerMonth);
  await step2SearchableBy(page);
  await step3BusinessContact(page, businessContact);
  await step4AImmersionOffer(
    page,
    establishmentRetries,
    retry,
    businessNameCustomized,
    updatedEstablishmentInfos,
    additionalInformation,
    website,
    businessAddress,
  );
  await step4BConfirm(page);
};

async function step4BConfirm(page: Page) {
  await page.click(`#${domElementIds.establishment.edit.submitFormButton}`);
  await expect(page.locator(".fr-alert--success")).toBeVisible();
  await page.waitForTimeout(testConfig.timeForEventCrawler);
}

async function step4AImmersionOffer(
  page: Page,
  establishmentRetries: EstablishmentsRetries,
  retry: number,
  businessNameCustomized: string,
  updatedEstablishmentInfos: Partial<FormEstablishmentDto>,
  additionalInformation: string,
  website: string,
  businessAddress: FormEstablishmentAddress,
) {
  await expect(
    page.locator(`#${domElementIds.establishment.edit.siret} input`),
  ).toBeDisabled();
  await expect(
    page.locator(`#${domElementIds.establishment.edit.siret} input`),
  ).toHaveValue(establishmentRetries[retry].siret);

  await page.fill(
    `#${domElementIds.establishment.edit.businessNameCustomized}`,
    businessNameCustomized,
  );

  await page.click(
    `[for=${domElementIds.establishment.edit.isEngagedEnterprise}-${
      updatedEstablishmentInfos.isEngagedEnterprise ? "1" : "0"
    }]`,
  );

  await page.click(
    `[for=${domElementIds.establishment.edit.fitForDisabledWorkers}-${
      updatedEstablishmentInfos.fitForDisabledWorkers ? "1" : "0"
    }]`,
  );

  await page.fill(
    `#${domElementIds.establishment.edit.additionalInformation}`,
    additionalInformation,
  );

  await page.fill(`#${domElementIds.establishment.edit.website}`, website);

  await page.click(
    `#${domElementIds.establishment.edit.businessAddresses}-delete-option-button-0`,
  );
  await page.click(
    `#${domElementIds.establishment.edit.businessAddresses}-delete-option-button-0`,
  ); // twice, to remove the second address

  await page.fill(
    `#${domElementIds.establishment.edit.appellations} .fr-input`,
    "buchero",
  );
  await page
    .locator(
      `#${domElementIds.establishment.edit.appellations} .MuiAutocomplete-option`,
    )
    .first()
    .click();

  await fillAutocomplete({
    page,
    locator: `#${domElementIds.establishment.edit.businessAddresses}-0`,
    value: businessAddress.rawAddress,
  });
}

const step3BusinessContact = async (
  page: Page,
  businessContact: BusinessContactDto,
): Promise<void> => {
  await expectLocatorToBeReadOnly(
    page,
    domElementIds.establishment.edit.businessContact.firstName,
  );

  await expectLocatorToBeReadOnly(
    page,
    domElementIds.establishment.edit.businessContact.lastName,
  );

  await page.fill(
    `#${domElementIds.establishment.edit.businessContact.job}`,
    businessContact.job,
  );

  await page.fill(
    `#${domElementIds.establishment.edit.businessContact.phone}`,
    businessContact.phone,
  );

  await page.fill(
    `#${domElementIds.establishment.edit.businessContact.email}`,
    businessContact.email,
  );

  await page
    .locator(
      `[for='${domElementIds.establishment.edit.businessContact.contactMethod}-1']`,
    )
    .click();

  await goToNextStep(page, 3, "edit");
};

async function step2SearchableBy(page: Page) {
  await page
    .locator(`[for="${domElementIds.establishment.edit.searchableBy}-1"]`)
    .click();
  await goToNextStep(page, 2, "edit");
}

async function step1Availability(
  page: Page,
  nextAvailabilityDate: DateTimeIsoString,
  maxContactsPerMonth: number,
) {
  await page
    .locator(`#${domElementIds.establishment.edit.availabilityButton}`)
    .getByText("Non")
    .click();

  await page
    .locator(`#${domElementIds.establishment.edit.nextAvailabilityDateInput}`)
    .fill(nextAvailabilityDate.split("T")[0]);

  await page.fill(
    `#${domElementIds.establishment.edit.maxContactsPerMonth}`,
    maxContactsPerMonth.toString(),
  );

  await goToNextStep(page, 1, "edit");
}

async function start(page: Page) {
  const startFormButtonLocator = await page.locator(
    `#${domElementIds.establishment.edit.startFormButton}`,
  );
  await expectLocatorToBeVisibleAndEnabled(startFormButtonLocator);

  await startFormButtonLocator.click();
}
