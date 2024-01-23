import { expect, Page, test } from "@playwright/test";
import { addressRoutes, AgencyId, domElementIds, frontRoutes } from "shared";
import { connectToAdmin, goToAdminTab } from "../../utils/admin";
import { fillAutocomplete } from "../../utils/utils";

test.describe.configure({ mode: "serial" });

test.describe("Agency workflow", () => {
  let agencyAddedId: AgencyId | null = null;

  test("Can add an agency (prescripteur), with one step of validators", async ({
    page,
  }) => {
    agencyAddedId = await fillAndSubmitBasicAgencyForm(page);
    await expect(page.locator(".fr-alert--success")).toBeVisible();
  });

  test("Cannot add a second agency with same data", async ({ page }) => {
    await fillAndSubmitBasicAgencyForm(page);
    await expect(page.locator(".fr-alert--error")).toBeVisible();
  });

  test("Rejects an agency in backoffice", async ({ page }) => {
    if (!agencyAddedId) throw new Error("agencyAddedId is null");
    await connectToAdmin(page);
    await goToAdminTab(page, "agencies");
    await page.locator(`#admin-agency-to-review-id`).click();
    await page.locator(`#admin-agency-to-review-id`).fill(agencyAddedId);

    await expect(
      await page.locator(`#admin-agency-to-review-submit`),
    ).toBeEnabled();

    await page.locator(`#admin-agency-to-review-submit`).click();

    await page.locator("#admin-agency-to-review-reject-button").click();

    await page
      .locator("#admin-agency-to-review-rejection-justification")
      .click();
    await page
      .locator("#admin-agency-to-review-rejection-justification")
      .fill("This is a justification");
    await page.locator("#admin-agency-to-review-reject-confirm-button").click();

    await expect(page.locator(".fr-alert--success")).toBeVisible();
  });
});

const fillAndSubmitBasicAgencyForm = async (
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
