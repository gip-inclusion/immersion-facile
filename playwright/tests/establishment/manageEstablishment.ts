import { expect, type Page } from "@playwright/test";
import {
  domElementIds,
  type FormEstablishmentDto,
  toDisplayedDate,
} from "shared";
import type { PlaywrightTestCallback } from "../../utils/utils";
import {
  checkAvailabilityButtons,
  type MakeFormEstablishmentFromRetryNumber,
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
    await checkAvailabilityButtons(page, "admin", "Oui");
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
    await checkAvailabilityButtons(page, "edit", "Non");
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
  await page.waitForTimeout(1000);
  await expect(await page.locator(".im-loader")).toBeHidden();
  const adminRight = updatedEstablishmentInfos.userRights.find(
    (right) => right.role === "establishment-admin",
  );
  if (!adminRight)
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
    await page.locator(`#${domElementIds.establishment.admin.contactMode}-1`),
  ).toBeChecked();

  await expect(
    (
      await page
        .locator(
          `#${domElementIds.establishment.admin.businessAddresses}-0-wrapper .im-select__single-value`,
        )
        .innerText()
    ).toLowerCase(),
  ).toContain(businessAddress.rawAddress.toLowerCase());

  const firstOfferCardContent = await page
    .locator(`#${domElementIds.establishment.admin.offerCard}-0`)
    .innerText();

  await expect(firstOfferCardContent).toContain("routage");

  await expect(firstOfferCardContent).toContain("100% PRÉSENTIEL");

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
