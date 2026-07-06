import { expect, type Page } from "@playwright/test";
import {
  domElementIds,
  type FormEstablishmentDto,
  type SiretDto,
} from "shared";
import { goToAdminTab } from "../../utils/admin";
import { getFormEstablishmentApiPath } from "../../utils/apiRoutes";
import { waitForVisibleLoaderHidden } from "../../utils/utils";

export const goToManageEstablishmentThroughEstablishmentDashboard = async (
  page: Page,
  establishment: FormEstablishmentDto,
) => {
  await page.goto("/");
  await page.locator("#fr-header-main-navigation-button-2").click();
  await page
    .locator(`#${domElementIds.header.navLinks.establishment.dashboard}`)
    .click();
  await expect(await page.locator(".fr-tabs__list li")).toHaveCount(3);
  await page.locator(".fr-tabs__list").getByText("Mon établissement").click();
  const establishmentSelector = await page.locator(
    `#${domElementIds.establishmentDashboard.manageEstablishments.selectEstablishmentInput}`,
  );
  if ((await establishmentSelector.count()) > 0) {
    await establishmentSelector.selectOption({
      value: establishment.siret,
    });
  }
};

export const goToManageEtablishmentBySiretInAdmin = async (
  page: Page,
  siret: SiretDto,
) => {
  await page.goto("/");
  await goToAdminTab(page, "adminEstablishments");
  const siretInputLocator = page.locator(
    `#${domElementIds.admin.manageEstablishment.siretInput}`,
  );
  await siretInputLocator.waitFor();
  await siretInputLocator.fill(siret);
  const formEstablishmentApiPath = getFormEstablishmentApiPath(siret);
  const establishmentResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(formEstablishmentApiPath) &&
      response.status() === 200,
  );
  await page.click(`#${domElementIds.admin.manageEstablishment.searchButton}`);
  await establishmentResponsePromise;

  await waitForVisibleLoaderHidden(page, ".im-loader");

  await expect(page.url()).toContain(`establishments/${siret}`);
};
