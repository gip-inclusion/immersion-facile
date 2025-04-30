import { type Page, expect } from "@playwright/test";
import {
  type FormEstablishmentDto,
  addressRoutes,
  domElementIds,
  toDisplayedDate,
} from "shared";
import type { PlaywrightTestCallback } from "../../utils/utils";
import {
  type MakeFormEstablishmentFromRetryNumber,
  checkAvailibilityButtons,
} from "./establishmentForm.utils";
import {
  goToManageEstablishmentThroughEstablishmentDashboard,
  goToManageEtablishmentBySiretInAdmin,
} from "./establishmentNavigation.utils";

export const checkEstablishmentUpdatedThroughBackOfficeAdmin =
  (
    makeUpdatedEstablishment: MakeFormEstablishmentFromRetryNumber,
  ): PlaywrightTestCallback =>
  async ({ page }, { retry }) => {
    const updatedEstablishment = makeUpdatedEstablishment(retry);
    await goToManageEtablishmentBySiretInAdmin(
      page,
      updatedEstablishment.siret,
    );
    await checkEstablishment(page, updatedEstablishment);
  };

export const checkAvailabilityThoughBackOfficeAdmin =
  (
    makeUpdatedEstablishment: MakeFormEstablishmentFromRetryNumber,
  ): PlaywrightTestCallback =>
  async ({ page }, { retry }) => {
    const updatedEstablishment = makeUpdatedEstablishment(retry);
    await goToManageEtablishmentBySiretInAdmin(
      page,
      updatedEstablishment.siret,
    );
    await checkAvailibilityButtons(page, "admin", "Oui");
  };

export const checkAvailabilityThoughEstablishmentDashboard =
  (
    makeUpdatedEstablishment: MakeFormEstablishmentFromRetryNumber,
  ): PlaywrightTestCallback =>
  async ({ page }, { retry }) => {
    const updatedEstablishment = makeUpdatedEstablishment(retry);
    await goToManageEstablishmentThroughEstablishmentDashboard(
      page,
      updatedEstablishment,
    );
    await checkAvailibilityButtons(page, "edit", "Non");
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
  updatedEstablishmentInfos: FormEstablishmentDto,
): Promise<void> => {
  await page.waitForResponse(`**${addressRoutes.lookupStreetAddress.url}**`);

  const adminRight = updatedEstablishmentInfos.userRights.find(
    (right) => right.role === "establishment-admin",
  );
  if (!adminRight)
    throw new Error("Missing business contact for updatedEstablishmentInfos");
  const copyEmails = updatedEstablishmentInfos.userRights
    .filter(({ role }) => role === "establishment-contact")
    .map(({ email }) => email);

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
      .locator(`#${domElementIds.establishment.admin.businessContact.job}`)
      .inputValue(),
  ).toBe(adminRight.job);

  await expect(
    await page
      .locator(`#${domElementIds.establishment.admin.businessContact.phone}`)
      .inputValue(),
  ).toContain(adminRight.phone.substring(1));

  await expect(
    await page
      .locator(
        `#${domElementIds.establishment.admin.businessContact.copyEmails}`,
      )
      .inputValue(),
  ).toContain(copyEmails.join(", "));

  await expect(
    await page.locator(`#${domElementIds.establishment.admin.contactMode}-1`),
  ).toBeChecked();

  await expect(
    (
      await page
        .locator(`#${domElementIds.establishment.admin.businessAddresses}-0`)
        .inputValue()
    ).toLowerCase(),
  ).toContain(businessAddress.rawAddress.toLowerCase());

  await expect(
    await page
      .locator(
        `#${domElementIds.establishment.admin.appellations}-0-wrapper .im-select__single-value`,
      )
      .innerText(),
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
