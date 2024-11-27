import { Page, expect } from "@playwright/test";
import { domElementIds } from "shared";
import { goToAdminTab } from "../../utils/admin";
import { TestEstablishments } from "./establishmentForm.utils";

export const goToManageEstablishmentThroughEstablishmentDashboard = async (
  page: Page,
  testEstablishments: TestEstablishments,
  retry: number,
) => {
  await page.goto("/");
  await page.locator("#fr-header-main-navigation-button-2").click();
  await page
    .locator(`#${domElementIds.header.navLinks.establishment.dashboard}`)
    .click();
  await page.locator(".fr-tabs").getByText("Fiche établissement").click();
  const establishmentSelector = await page.locator(
    `#${domElementIds.establishmentDashboard.manageEstablishments.selectEstablishmentInput}`,
  );
  if ((await establishmentSelector.count()) > 0) {
    await establishmentSelector.selectOption({
      value: testEstablishments[retry].siret,
    });
  }
};

export const goToManageEtablishmentBySiretInAdmin = async (
  page: Page,
  retry: number,
  testEstablishments: TestEstablishments,
) => {
  await page.goto("/");
  await goToAdminTab(page, "adminEstablishments");
  const siretInputLocator = page.locator(
    `#${domElementIds.admin.manageEstablishment.siretInput}`,
  );
  await siretInputLocator.waitFor();
  await siretInputLocator.fill(testEstablishments[retry].siret);
  // await page.focus(
  //   `#${domElementIds.admin.manageEstablishment.searchButton}`,
  // );
  await page.click(`#${domElementIds.admin.manageEstablishment.searchButton}`);
  await page.waitForTimeout(1000); // waiting for fetch and render
  await expect(page.url()).toContain("pilotage-etablissement-admin");
};
