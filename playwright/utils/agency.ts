import { Page, expect } from "@playwright/test";
import { AgencyId, addressRoutes, domElementIds, frontRoutes } from "shared";
import { goToAdminTab } from "./admin";
import { fillAutocomplete } from "./utils";

export const fillAndSubmitBasicAgencyForm = async (
  page: Page,
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
    .fill("751 984 972 00016");

  await expect(
    await page.locator(`#${domElementIds.addAgency.nameInput}`),
  ).toHaveValue(
    "CONFEDERATION NATIONALE HANDICAP & EMPLOI DES ORGANISMES DE PLACEMENT SPECIALISES (CHEOPS)",
  );
  await expect(
    await page.locator(`#${domElementIds.addAgency.addressAutocomplete}`),
  ).toHaveValue("55 Rue Boissonade 75014 Paris");

  await page
    .locator(`#${domElementIds.addAgency.nameInput}`)
    .fill("Cap emploi de Bayonne");
  await page.locator(`#${domElementIds.addAgency.addressAutocomplete}`).click();
  await page.locator(`#${domElementIds.addAgency.addressAutocomplete}`).clear();
  await fillAutocomplete({
    page,
    locator: `#${domElementIds.addAgency.addressAutocomplete}`,
    value: "18 rue des tonneliers",
    endpoint: addressRoutes.lookupStreetAddress.url,
  });

  await expect(
    await page.locator(`#${domElementIds.addAgency.nameInput}`),
  ).toHaveValue("Cap emploi de Bayonne");
  await expect(
    await page.locator(`#${domElementIds.addAgency.addressAutocomplete}`),
  ).toHaveValue("18 Rue des Tonneliers 67065 Strasbourg");

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

  await page.locator(`#${domElementIds.addAgency.submitButton}`).click();

  return page.locator(`#${domElementIds.addAgency.id}`).getAttribute("value");
};

export const rejectAgencyInAdmin = async (page: Page, agencyId: AgencyId) => {
  await goToAdminTab(page, "agencies");
  await page
    .locator(`#${domElementIds.admin.agencyTab.agencyToReviewInput}`)
    .click();
  await page
    .locator(`#${domElementIds.admin.agencyTab.agencyToReviewInput}`)
    .fill(agencyId);

  await expect(
    await page.locator(
      `#${domElementIds.admin.agencyTab.agencyToReviewButton}`,
    ),
  ).toBeEnabled();

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
