import { type Page, expect } from "@playwright/test";
import {
  type EstablishmentFormUserRights,
  type FormEstablishmentDto,
  addressRoutes,
  domElementIds,
} from "shared";
import { testConfig } from "../../custom.config";
import {
  goToDashboard,
  goToEstablishmentDashboardTab,
} from "../../utils/dashboard";
import {
  type PlaywrightTestCallback,
  expectLocatorToBeReadOnly,
  fillAutocomplete,
} from "../../utils/utils";
import { goToManageEtablishmentBySiretInAdmin } from "./establishmentNavigation.utils";

export const updateEstablishmentThroughEstablishmentDashboard =
  (updatedFormEstablishment: FormEstablishmentDto): PlaywrightTestCallback =>
  async ({ page }) => {
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
  (updatedEstablishment: FormEstablishmentDto): PlaywrightTestCallback =>
  async ({ page }) => {
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

  await step1Availability(page, updatedEstablishment);
  await step2SearchableBy(page);
  await step3BusinessContact(page, userRights);
  await step4AImmersionOffer(page, updatedEstablishment);
  await step4BConfirm(page);
};

const step1Availability = async (
  page: Page,
  updatedEstablishment: FormEstablishmentDto,
) => {
  if (!updatedEstablishment.nextAvailabilityDate)
    throw new Error(
      "Missing next availability date for updatedEstablishmentInfos",
    );

  await page
    .locator(`#${domElementIds.establishment.edit.availabilityButton}`)
    .getByText("Non")
    .click();

  await page
    .locator(`#${domElementIds.establishment.edit.nextAvailabilityDateInput}`)
    .fill(updatedEstablishment.nextAvailabilityDate.split("T")[0]);

  const maxContactPerMonthLocator = await page.locator(
    `#${domElementIds.establishment.edit.maxContactsPerMonth}`,
  );

  const maxContactPerMonthLocatorCurrentValue =
    await maxContactPerMonthLocator.inputValue();
  await expect(maxContactPerMonthLocatorCurrentValue).not.toBe("");
  await expect(maxContactPerMonthLocatorCurrentValue).not.toBe(
    updatedEstablishment.maxContactsPerMonth.toString(),
  );
  await maxContactPerMonthLocator.fill(
    updatedEstablishment.maxContactsPerMonth.toString(),
  );
};

const step2SearchableBy = async (page: Page) => {
  await page
    .locator(`[for="${domElementIds.establishment.edit.searchableBy}-1"]`)
    .click();
};

const step3BusinessContact = async (
  page: Page,
  userRights: EstablishmentFormUserRights,
): Promise<void> => {
  const firstAdmin = userRights.find(
    (right) => right.role === "establishment-admin",
  );

  if (!firstAdmin)
    throw new Error("No establishment admin provided on updated form");
  const contactEmails = userRights
    .filter((right) => right.role === "establishment-contact")
    .map(({ email }) => email);

  const firstNameLocator = page.locator(
    `#${domElementIds.establishment.edit.businessContact.firstName}`,
  );
  await expectLocatorToBeReadOnly(firstNameLocator);

  const lastNameLocator = page.locator(
    `#${domElementIds.establishment.edit.businessContact.lastName}`,
  );
  await expectLocatorToBeReadOnly(lastNameLocator);

  const adminEmailLocator = page.locator(
    `#${domElementIds.establishment.edit.businessContact.email}`,
  );
  await expectLocatorToBeReadOnly(adminEmailLocator);

  await page.fill(
    `#${domElementIds.establishment.edit.businessContact.job}`,
    firstAdmin.job,
  );

  await page.fill(
    `#${domElementIds.establishment.edit.businessContact.phone}`,
    firstAdmin.phone,
  );

  await page.fill(
    `#${domElementIds.establishment.edit.businessContact.copyEmails}`,
    contactEmails.join(","),
  );

  await page
    .locator(`[for='${domElementIds.establishment.edit.contactMethod}-1']`)
    .click();

  // await goToNextStep(page, 3, "edit");
};

const step4AImmersionOffer = async (
  page: Page,
  updatedEstablishment: FormEstablishmentDto,
) => {
  const businessAddress = updatedEstablishment.businessAddresses.at(0);

  if (!businessAddress)
    throw new Error(
      "Missing first business address for updatedEstablishmentInfos",
    );

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

  await page.fill(
    `#${domElementIds.establishment.edit.additionalInformation}`,
    updatedEstablishment.additionalInformation,
  );

  await page.fill(
    `#${domElementIds.establishment.edit.website}`,
    updatedEstablishment.website,
  );

  await page.click(
    `#${domElementIds.establishment.edit.businessAddresses}-delete-option-button-0`,
  );
  await page.click(
    `#${domElementIds.establishment.edit.businessAddresses}-delete-option-button-0`,
  ); // twice, to remove the second address

  await page.fill(
    `#${domElementIds.establishment.edit.appellations} .im-select__input`,
    "buchero",
  );
  await page
    .locator(
      `#${domElementIds.establishment.edit.appellations} .im-select__option`,
    )
    .first()
    .click();

  await fillAutocomplete({
    page,
    locator: `#${domElementIds.establishment.edit.businessAddresses}-0`,
    value: businessAddress.rawAddress,
    endpoint: addressRoutes.lookupStreetAddress.url,
  });
};

const step4BConfirm = async (page: Page) => {
  await page.click(`#${domElementIds.establishment.edit.submitFormButton}`);
  await expect(page.locator(".fr-alert--success")).toBeVisible();
  await page.waitForTimeout(testConfig.timeForEventCrawler);
};
