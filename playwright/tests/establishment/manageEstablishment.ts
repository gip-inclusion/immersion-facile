import { Page, expect } from "@playwright/test";
import { FormEstablishmentDto, domElementIds, toDisplayedDate } from "shared";
import { PlaywrightTestCallback } from "../../utils/utils";
import {
  TestEstablishments,
  checkAvailibilityButtons,
} from "./establishmentForm.utils";
import {
  goToManageEstablishmentThroughEstablishmentDashboard,
  goToManageEtablishmentBySiretInAdmin,
} from "./establishmentNavigation.utils";

export const checkEstablishmentUpdatedThroughBackOfficeAdmin =
  (
    updatedEstablishmentInfos: Partial<FormEstablishmentDto>,
    testEstablishments: TestEstablishments,
  ): PlaywrightTestCallback =>
  async ({ page }, { retry }) => {
    await goToManageEtablishmentBySiretInAdmin(page, retry, testEstablishments);
    await checkEstablishment(page, updatedEstablishmentInfos);
  };

export const checkAvailabilityThoughBackOfficeAdmin =
  (testEstablishments: TestEstablishments): PlaywrightTestCallback =>
  async ({ page }, { retry }) => {
    await goToManageEtablishmentBySiretInAdmin(page, retry, testEstablishments);
    await checkAvailibilityButtons(page, "admin");
  };

export const checkAvailabilityThoughEstablishmentDashboard =
  (testEstablishments: TestEstablishments): PlaywrightTestCallback =>
  async ({ page }, { retry }) => {
    await goToManageEstablishmentThroughEstablishmentDashboard(
      page,
      testEstablishments,
      retry,
    );
    await checkAvailibilityButtons(page, "edit");
  };

export const deleteEstablishmentInBackOfficeAdmin = async (
  page: Page,
): Promise<void> => {
  await page.click(
    `#${domElementIds.admin.manageEstablishment.submitDeleteButton}`,
  );
  await expect(page.locator(".fr-alert--success")).toBeVisible();
};

const checkEstablishment = async (
  page: Page,
  updatedEstablishmentInfos: Partial<FormEstablishmentDto>,
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

  await expect(
    await page
      .locator(`#${domElementIds.establishment.admin.maxContactsPerMonthValue}`)
      .textContent(),
  ).toBe(maxContactsPerMonth.toString());

  await expect(
    await page
      .locator(
        `#${domElementIds.establishment.admin.nextAvailabilityDateValue}`,
      )
      .textContent(),
  ).toBe(
    toDisplayedDate({
      date: new Date(nextAvailabilityDate),
    }),
  );

  await expect(
    await page
      .locator(`#${domElementIds.establishment.admin.businessNameCustomized}`)
      .inputValue(),
  ).toBe(businessNameCustomized);

  await expect(
    await page.locator(`#${domElementIds.establishment.admin.searchableBy}-1`),
  ).toBeChecked();

  await expect(
    await page
      .locator(
        `#${domElementIds.establishment.admin.businessContact.firstName}`,
      )
      .inputValue(),
  ).toBe(businessContact.firstName);

  await expect(
    await page
      .locator(`#${domElementIds.establishment.admin.businessContact.lastName}`)
      .inputValue(),
  ).toBe(businessContact.lastName);

  await expect(
    await page
      .locator(`#${domElementIds.establishment.admin.businessContact.job}`)
      .inputValue(),
  ).toBe(businessContact.job);

  await expect(
    await page
      .locator(`#${domElementIds.establishment.admin.businessContact.phone}`)
      .inputValue(),
  ).toContain(businessContact.phone.substring(1));

  await expect(
    await page
      .locator(`#${domElementIds.establishment.admin.businessContact.email}`)
      .inputValue(),
  ).toBe(businessContact.email);

  await expect(
    await page.locator(
      `#${domElementIds.establishment.admin.businessContact.contactMethod}-1`,
    ),
  ).toBeChecked();

  await expect(
    (
      await page
        .locator(`#${domElementIds.establishment.admin.businessAddresses}-0`)
        .inputValue()
    ).toLowerCase(),
  ).toBe(businessAddress.rawAddress.toLowerCase());

  await expect(
    await page
      .locator(`#${domElementIds.establishment.admin.appellations} input`)
      .inputValue(),
  ).toContain("Bûcheron");

  await expect(
    await page.locator(
      `#${domElementIds.establishment.admin.fitForDisabledWorkers}-${
        updatedEstablishmentInfos.fitForDisabledWorkers ? "1" : "0"
      }`,
    ),
  ).toBeChecked();

  await expect(
    await page.locator(
      `#${domElementIds.establishment.admin.isEngagedEnterprise}-${
        updatedEstablishmentInfos.isEngagedEnterprise ? "1" : "0"
      }`,
    ),
  ).toBeChecked();

  await expect(
    await page
      .locator(`#${domElementIds.establishment.admin.website}`)
      .inputValue(),
  ).toBe(website);

  await expect(
    await page
      .locator(`#${domElementIds.establishment.admin.additionalInformation}`)
      .inputValue(),
  ).toBe(additionalInformation);
};
