import { expect, type Page } from "@playwright/test";
import {
  addressRoutes,
  domElementIds,
  type FormEstablishmentDto,
} from "shared";
import {
  goToDashboard,
  goToEstablishmentDashboardTab,
} from "../../utils/dashboard";
import {
  fillAutocomplete,
  type PlaywrightTestCallback,
} from "../../utils/utils";
import type { MakeFormEstablishmentFromRetryNumber } from "./establishmentForm.utils";
import { goToManageEtablishmentBySiretInAdmin } from "./establishmentNavigation.utils";

export const updateEstablishmentThroughEstablishmentDashboard =
  (
    makeUpdatedFormEstablishment: MakeFormEstablishmentFromRetryNumber,
  ): PlaywrightTestCallback =>
  async ({ page }, { retry }) => {
    const updatedFormEstablishment = makeUpdatedFormEstablishment(retry);
    await page.goto("/");
    await goToDashboard(page, "establishment");
    await expect(page.locator(".fr-tabs__list")).toBeVisible();

    await goToEstablishmentDashboardTab(page, "fiche-entreprise");

    await page.waitForURL(
      `/tableau-de-bord-etablissement/fiche-entreprise?siret=${updatedFormEstablishment.siret}`,
    );

    await editEstablishmentInEstablishmentDashboard(
      page,
      updatedFormEstablishment,
    );
  };

export const updateEstablishmentAvailabilityThroughBackOfficeAdmin =
  (
    makeUpdatedEstablishment: MakeFormEstablishmentFromRetryNumber,
  ): PlaywrightTestCallback =>
  async ({ page }, { retry }) => {
    const updatedEstablishment = makeUpdatedEstablishment(retry);
    await goToManageEtablishmentBySiretInAdmin(
      page,
      updatedEstablishment.siret,
    );

    await page
      .locator(`#${domElementIds.establishment.admin.availabilityButton}`)
      .getByText("Oui")
      .click();
    await page.click(`#${domElementIds.establishment.admin.submitFormButton}`);
    await expect(page.locator(".fr-alert--success")).toBeVisible();
  };

const editEstablishmentInEstablishmentDashboard = async (
  page: Page,
  updatedEstablishment: FormEstablishmentDto,
): Promise<void> => {
  const userRights = updatedEstablishment.userRights;
  if (!userRights)
    throw new Error("Missing user rights for updatedEstablishmentInfos");
  const adminEmail = await page
    .locator("#establishment-users-table tr:first-of-type td:first-of-type")
    .textContent();
  await expect(adminEmail).toBe(userRights[0].email);
  await step1(page, updatedEstablishment);
  await step2(page, updatedEstablishment);
  await step3(page, updatedEstablishment);
  await step4(page, updatedEstablishment);
};

const step1 = async (
  page: Page,
  updatedEstablishment: FormEstablishmentDto,
) => {
  if (!updatedEstablishment.businessNameCustomized)
    throw new Error(
      "Missing business name customized for updatedEstablishmentInfos",
    );

  if (!updatedEstablishment.additionalInformation)
    throw new Error(
      "Missing additional information for updatedEstablishmentInfos",
    );

  if (!updatedEstablishment.website)
    throw new Error("Missing website for updatedEstablishmentInfos");

  await expect(
    page.locator(`#${domElementIds.establishment.edit.siret} input`),
  ).toBeDisabled();
  await expect(
    page.locator(`#${domElementIds.establishment.edit.siret} input`),
  ).toHaveValue(updatedEstablishment.siret);

  await page.fill(
    `#${domElementIds.establishment.edit.businessNameCustomized}`,
    updatedEstablishment.businessNameCustomized,
  );

  await page.fill(
    `#${domElementIds.establishment.edit.additionalInformation}`,
    updatedEstablishment.additionalInformation,
  );

  await page.fill(
    `#${domElementIds.establishment.edit.website}`,
    updatedEstablishment.website,
  );
};

const step2 = async (
  page: Page,
  updatedEstablishment: FormEstablishmentDto,
) => {
  const businessAddress = updatedEstablishment.businessAddresses.at(0);

  if (!businessAddress)
    throw new Error(
      "Missing first business address for updatedEstablishmentInfos",
    );

  await page.click(
    `#${domElementIds.establishment.edit.businessAddresses}-delete-option-button-0`,
  );
  await page.click(
    `#${domElementIds.establishment.edit.businessAddresses}-delete-option-button-0`,
  ); // twice, to remove the second address

  await page.click(`#${domElementIds.establishment.edit.deleteOfferButton}-0`);

  await page.click(`#${domElementIds.establishment.edit.editOfferButton}-0`);

  await page.click(
    `[for='${domElementIds.establishment.edit.remoteWorkMode}-2']`, // ON_SITE
  );

  await page.click(`#${domElementIds.establishment.offerModalSubmitButton}`);

  await fillAutocomplete({
    page,
    locator: `#${domElementIds.establishment.edit.businessAddresses}-0`,
    value: businessAddress.rawAddress,
    endpoint: addressRoutes.lookupStreetAddress.url,
  });
};

const step3 = async (
  page: Page,
  updatedEstablishment: FormEstablishmentDto,
): Promise<void> => {
  if (!updatedEstablishment.nextAvailabilityDate)
    throw new Error(
      "Missing next availability date for updatedEstablishmentInfos",
    );

  const unavailableRadioLocator = page.locator(
    `[for="${domElementIds.establishment.edit.availabilityButton}-0"]`,
  );
  await unavailableRadioLocator.click();

  await page
    .locator(`#${domElementIds.establishment.edit.nextAvailabilityDateInput}`)
    .fill(updatedEstablishment.nextAvailabilityDate.split("T")[0]);

  await page.fill(
    `#${domElementIds.establishment.edit.maxContactsPerMonth}`,
    updatedEstablishment.maxContactsPerMonth.toString(),
  );

  await page
    .locator(`[for="${domElementIds.establishment.edit.searchableBy}-1"]`)
    .click();
  await page
    .locator(`[for='${domElementIds.establishment.edit.contactMode}-1']`)
    .click();

  await page.click(
    `[for=${domElementIds.establishment.edit.isEngagedEnterprise}-${
      updatedEstablishment.isEngagedEnterprise ? "1" : "0"
    }]`,
  );

  await page.click(
    `[for=${domElementIds.establishment.edit.fitForDisabledWorkers}-${
      updatedEstablishment.fitForDisabledWorkers ? "1" : "0"
    }]`,
  );
};

const step4 = async (
  page: Page,
  updatedEstablishment: FormEstablishmentDto,
) => {
  await page.click(`#${domElementIds.establishment.edit.submitFormButton}`);
  await expect(page.url()).toContain(`siret=${updatedEstablishment.siret}`);
  await expect(page.locator(".fr-alert--success")).toBeVisible();
};
