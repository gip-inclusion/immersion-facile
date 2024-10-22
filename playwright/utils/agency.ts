import { faker } from "@faker-js/faker";
import { Page, expect } from "@playwright/test";
import { AgencyId, addressRoutes, domElementIds, frontRoutes } from "shared";
import { goToAdminTab } from "./admin";
import { expectLocatorToBeVisibleAndEnabled, fillAutocomplete } from "./utils";

export const fillAndSubmitBasicAgencyForm = async (
  page: Page,
  override?: {
    siret?: string;
    customizedName?: string;
    rawAddress?: string;
  },
): Promise<AgencyId | null> => {
  await page.goto(frontRoutes.addAgency);
  await page
    .locator(`[for="${domElementIds.addAgency.agencyRefersToInput}-0"]`)
    .click();
  await page
    .locator(`#${domElementIds.addAgency.kindSelect}`)
    .selectOption("cap-emploi");

  await page.locator(`#${domElementIds.addAgency.agencySiretInput}`).click();
  await page
    .locator(`#${domElementIds.addAgency.agencySiretInput}`)
    .fill(override?.siret ?? "751 984 972 00016");

  await expect(
    await page.locator(`#${domElementIds.addAgency.addressAutocomplete}`),
  ).toHaveValue(override?.rawAddress ?? "55 Rue Boissonade 75014 Paris");

  await page
    .locator(`#${domElementIds.addAgency.nameInput}`)
    .fill(override?.customizedName ?? "Cap emploi de Bayonne");
  await page.locator(`#${domElementIds.addAgency.addressAutocomplete}`).click();
  await page.locator(`#${domElementIds.addAgency.addressAutocomplete}`).clear();
  await fillAutocomplete({
    page,
    locator: `#${domElementIds.addAgency.addressAutocomplete}`,
    value: override?.rawAddress ? "17 rue lamartine" : "18 rue des tonneliers",
    endpoint: addressRoutes.lookupStreetAddress.url,
  });

  await expect(
    await page.locator(`#${domElementIds.addAgency.nameInput}`),
  ).toHaveValue(override?.customizedName ?? "Cap emploi de Bayonne");

  await page
    .locator(`#${domElementIds.addAgency.validatorEmailsInput}`)
    .click();
  await page
    .locator(`#${domElementIds.addAgency.validatorEmailsInput}`)
    .fill("valideur@cap.com");

  await page.locator(`#${domElementIds.addAgency.signatureInput}`).click();
  await page
    .locator(`#${domElementIds.addAgency.signatureInput}`)
    .fill("Mon équipe de ouf !");
  const agencyId = await page
    .locator(`#${domElementIds.addAgency.id}`)
    .getAttribute("value");
  await page.locator(`#${domElementIds.addAgency.submitButton}`).click();
  return agencyId;
};

export const rejectAgencyInAdmin = async (page: Page, agencyId: AgencyId) => {
  await page.goto("/");
  await goToAdminTab(page, "adminAgencies");
  await page
    .locator(`#${domElementIds.admin.agencyTab.agencyToReviewInput}`)
    .click();
  await page
    .locator(`#${domElementIds.admin.agencyTab.agencyToReviewInput}`)
    .fill(agencyId);

  await expectLocatorToBeVisibleAndEnabled(
    await page.locator(
      `#${domElementIds.admin.agencyTab.agencyToReviewButton}`,
    ),
  );

  await page
    .locator(`#${domElementIds.admin.agencyTab.agencyToReviewButton}`)
    .click();

  await page
    .locator(`#${domElementIds.admin.agencyTab.agencyToReviewRejectButton}`)
    .click();

  await page
    .locator(
      `#${domElementIds.admin.agencyTab.rejectAgencyModalJustificationInput}`,
    )
    .click();
  await page
    .locator(
      `#${domElementIds.admin.agencyTab.rejectAgencyModalJustificationInput}`,
    )
    .fill("This is a justification");
  await page
    .locator(`#${domElementIds.admin.agencyTab.rejectAgencyModalSubmitButton}`)
    .click();

  await expect(page.locator(".fr-alert--success")).toBeVisible();
};

export const addUserToAgency = async (page: Page, agencyName: string) => {
  await page.goto("/");
  await goToAdminTab(page, "adminAgencies");
  await fillAutocomplete({
    page,
    locator: `#${domElementIds.admin.agencyTab.editAgencyAutocompleteInput}`,
    value: agencyName,
  });
  await expect(
    page.locator(`#${domElementIds.admin.agencyTab.agencyUsersTable}`),
  ).toBeVisible();
  const addUserButton = page.locator(
    `#${domElementIds.admin.agencyTab.openManageUserModalButton}`,
  );
  await expect(addUserButton).toBeVisible();
  await addUserButton.click();
  await expect(
    page.locator(`#${domElementIds.admin.agencyTab.editAgencyManageUserModal}`),
  ).toBeVisible();
  await page
    .locator(`#${domElementIds.admin.agencyTab.editAgencyUserEmail}`)
    .fill(faker.internet.email());
  await page
    .locator(
      `[for="${domElementIds.admin.agencyTab.editAgencyManageUserCheckbox}-1"]`,
    )
    .click();
  await page
    .locator(
      `#${domElementIds.admin.agencyTab.editAgencyUserIsNotifiedByEmail}`,
    )
    .click();
  await page
    .locator(`#${domElementIds.admin.agencyTab.editAgencyUserRoleSubmitButton}`)
    .click();
  await expect(page.locator(".fr-alert--success").first()).toBeVisible();
};
