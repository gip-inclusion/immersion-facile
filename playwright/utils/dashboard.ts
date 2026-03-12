import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import {
  domElementIds,
  type EstablishmentDashboardTab,
  establishmentDashboardTabsList,
  frontRoutes,
} from "shared";
import { getTabIndexByTabName } from "./admin";
import { fillConventionForm } from "./convention";

export const goToEstablishmentDashboardTab = async (
  page: Page,
  tab: EstablishmentDashboardTab,
) => {
  await page.waitForTimeout(2000);
  await page.waitForSelector(".fr-tabs__list li");
  const tabLocator = await page
    .locator(".fr-tabs__list li")
    .nth(getTabIndexByTabName(establishmentDashboardTabsList, tab))
    .locator(".fr-tabs__tab");
  await tabLocator.click({ force: true });
};

export const goToDashboard = async (
  page: Page,
  userKind: "agency" | "establishment",
) => {
  const selector =
    userKind === "agency"
      ? "#fr-header-main-navigation-button-3"
      : "#fr-header-main-navigation-button-2";
  await page.click(selector);
  const submenuItemSelector = `#${domElementIds.header.navLinks[userKind].dashboard}`;
  await page.click(submenuItemSelector);
};

export const createConventionTemplate = async (
  page: Page,
  dashboardKind: "agency" | "establishment",
) => {
  await page.goto("/");
  await goToDashboard(page, dashboardKind);

  await page.click(
    `#${domElementIds.conventionTemplate.createConventionTemplateButton}`,
  );
  await page.waitForURL(`${frontRoutes.conventionTemplate}**`);

  await page.fill(
    `#${domElementIds.conventionTemplate.form.nameInput}`,
    "Mon premier modèle de convention",
  );
  await fillConventionForm(page);

  await page.click(
    `#${domElementIds.conventionTemplate.form.submitFormButton}`,
  );
  await expect(page.locator(".fr-alert--success")).toBeVisible();

  await goToDashboard(page, dashboardKind);
  await expect(page.locator('[id^="convention-template-"]')).toHaveCount(1);
};

export const deleteConventionTemplate = async (
  page: Page,
  dashboardKind: "agency" | "establishment",
) => {
  await page.goto("/");
  await goToDashboard(page, dashboardKind);

  await expect(page.locator('[id^="convention-template-"]')).toHaveCount(1);

  await page.click(
    `[id^="${domElementIds.conventionTemplate.deleteConventionTemplateButton}-"]`,
  );
  await page.click(
    `#${domElementIds.conventionTemplate.deleteConventionTemplate.confirmButton}`,
  );
  await expect(page.locator(".fr-alert--success")).toBeVisible();
  await expect(page.locator('[id^="convention-template-"]')).toHaveCount(0);
};

export const initiateConvention = async ({
  page,
  dashboardKind,
  fromConventionTemplate,
}: {
  page: Page;
  dashboardKind: "agency" | "establishment";
  fromConventionTemplate: boolean;
}): Promise<string | undefined> => {
  const domIds =
    dashboardKind === "agency"
      ? domElementIds.agencyDashboard
      : domElementIds.establishmentDashboard;
  await page.goto("/");
  await goToDashboard(page, dashboardKind);
  await page.click(`#${domIds.initiateConvention.button}`);
  await expect(
    page.locator(`#${domIds.initiateConvention.modal}`),
  ).toBeVisible();

  if (fromConventionTemplate) {
    await initiateConventionFromConventionTemplate({ page, dashboardKind });
    return;
  }

  if (dashboardKind === "establishment") {
    await initiateConventionFromEstablishmentInformations({ page });
    return;
  }

  await initiateConventionFromAgencyInformations({ page });
};

const initiateConventionFromConventionTemplate = async ({
  page,
  dashboardKind,
}: {
  page: Page;
  dashboardKind: "agency" | "establishment";
}) => {
  const domIds =
    dashboardKind === "agency"
      ? domElementIds.agencyDashboard
      : domElementIds.establishmentDashboard;
  await page.goto("/");
  await goToDashboard(page, dashboardKind);
  await page.click(`#${domIds.initiateConvention.button}`);
  await expect(
    page.locator(`#${domIds.initiateConvention.modal}`),
  ).toBeVisible();

  const templateRadioButtonLocator = page.locator(
    `[for='${domIds.initiateConvention.sourceRadioButtons}-1']`,
  );

  await templateRadioButtonLocator.click();

  const firstConventionTemplateLocator = page.locator(
    `[for='${domIds.initiateConvention.templateRadioButtons}-0']`,
  );

  await firstConventionTemplateLocator.click();

  await page.click(`#${domIds.initiateConvention.modalButton}`);
  await expect(
    page.locator(`#${domElementIds.conventionImmersionRoute.submitFormButton}`),
  ).toBeVisible();
  await page
    .locator(`#${domElementIds.conventionImmersionRoute.submitFormButton}`)
    .click();
  await page.locator(".im-convention-summary__section").first().isVisible();
};

const initiateConventionFromEstablishmentInformations = async ({
  page,
}: {
  page: Page;
}) => {
  const establishmentSelectLocator = page.locator(
    `#${domElementIds.establishmentDashboard.initiateConvention.establishmentSelect}`,
  );
  if (!(await establishmentSelectLocator.isDisabled())) {
    await establishmentSelectLocator.selectOption({
      label: "France Merguez Distribution",
    });
  }

  const appellationSelectLocator = page.locator(
    `#${domElementIds.establishmentDashboard.initiateConvention.appellationSelect}`,
  );
  await appellationSelectLocator.selectOption({ index: 1 });
  const selectedAppellation =
    (
      await appellationSelectLocator.locator("option:checked").textContent()
    )?.trim() ?? "";

  const addressSelectLocator = page.locator(
    `#${domElementIds.establishmentDashboard.initiateConvention.addressSelect}`,
  );
  await addressSelectLocator.selectOption({ index: 1 });
  const selectedAddress = await addressSelectLocator.inputValue();

  await page.click(
    `#${domElementIds.establishmentDashboard.initiateConvention.modalButton}`,
  );

  expect(
    page.locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.immersionAddress}`,
    ),
  ).toHaveValue(selectedAddress);
  expect(
    page.locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.immersionAppellation}-wrapper .im-select__single-value`,
    ),
  ).toHaveText(selectedAppellation);
};

const initiateConventionFromAgencyInformations = async ({
  page,
}: {
  page: Page;
}) => {
  await page.click(
    `#${domElementIds.agencyDashboard.initiateConvention.modalButton}`,
  );

  await expect(
    page.locator(`#${domElementIds.conventionImmersionRoute.submitFormButton}`),
  ).toBeVisible();
  await expect(
    page.locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.agencyReferentFirstName}`,
    ),
  ).toHaveValue("Jean");
  await expect(
    page.locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.agencyReferentLastName}`,
    ),
  ).toHaveValue("Immersion");
};
