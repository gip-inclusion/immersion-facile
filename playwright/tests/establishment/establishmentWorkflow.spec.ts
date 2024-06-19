import { faker } from "@faker-js/faker/locale/fr";
import { Page, expect, test } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";
import { testConfig } from "../../custom.config";
import { goToAdminTab } from "../../utils/admin";
import { fillAutocomplete, phoneRegexp } from "../../utils/utils";

const providedSiret = "41433740200039";

test.describe.configure({ mode: "serial" });

test.describe("Establishment creation and modification workflow", () => {
  test("creates a new establishment", async ({ page }) => {
    await page.goto("/");
    await page.click(`#${domElementIds.home.heroHeader.establishment}`);
    await page.click(
      `#${domElementIds.homeEstablishments.heroHeader.addEstablishmentForm}`,
    );
    await page.fill(
      `#${domElementIds.homeEstablishments.siretModal.siretFetcherInput}`,
      providedSiret,
    );
    const addEstablishmentButton = page.locator(
      `#${domElementIds.establishment.create.startFormButton}`,
    );
    await addEstablishmentButton.click();

    await page.locator(".fr-radio-rich").getByText("Oui").click();

    await goToNextStep(page, 1, "create");
    await page
      .locator(`[for="${domElementIds.establishment.create.searchableBy}-1"]`)
      .click();

    await goToNextStep(page, 2, "create");
    await page.fill(
      `#${domElementIds.establishment.create.businessContact.firstName}`,
      faker.person.firstName(),
    );
    await page.fill(
      `#${domElementIds.establishment.create.businessContact.lastName}`,
      faker.person.lastName(),
    );
    await page.fill(
      `#${domElementIds.establishment.create.businessContact.job}`,
      faker.person.jobType(),
    );
    await page.fill(
      `#${domElementIds.establishment.create.businessContact.phone}`,
      faker.helpers.fromRegExp(phoneRegexp),
    );
    await page.fill(
      `#${domElementIds.establishment.create.businessContact.email}`,
      "recette+establishment@immersion-facile.beta.gouv.fr",
    );
    await page
      .locator(
        `[for='${domElementIds.establishment.create.businessContact.contactMethod}-0']`,
      )
      .click();

    await goToNextStep(page, 3, "create");

    await expect(
      page.locator(`#${domElementIds.establishment.create.siret}`),
    ).toHaveValue(providedSiret);
    await expect(
      page.locator(`#${domElementIds.establishment.create.businessName}`),
    ).not.toHaveValue("");
    await expect(
      page.locator(
        `#${domElementIds.establishment.create.addressAutocomplete}`,
      ),
    ).not.toHaveValue("");
    await page.click(
      `#${domElementIds.establishment.create.appellations}-add-option-button`,
    );
    await page.fill(
      `#${domElementIds.establishment.create.appellations} .fr-input`,
      "boulang",
    );
    await page
      .locator(
        `#${domElementIds.establishment.create.appellations} .MuiAutocomplete-option`,
      )
      .first()
      .click();

    await expect(
      page.locator(
        `#${domElementIds.establishment.create.businessAddresses}-0`,
      ),
    ).toHaveValue("Avenue des Grands Crus 26600 Tain-l'Hermitage");

    await page.click(
      `#${domElementIds.establishment.create.businessAddresses}-add-option-button`,
    );

    await fillAutocomplete({
      page,
      locator: `#${domElementIds.establishment.create.businessAddresses}-1`,
      value: "28 rue des mimosas",
    });

    await page.click(`#${domElementIds.establishment.create.submitFormButton}`);
    await expect(page.url()).toContain(`siret=${providedSiret}`);
    await expect(page.locator(".fr-alert--success")).toBeVisible();
    await page.waitForTimeout(testConfig.timeForEventCrawler);
  });

  test("modifies an existing establishment", async ({ page }) => {
    await page.goto("/");
    await page.click(`#${domElementIds.home.heroHeader.establishment}`);
    await page.click(
      `#${domElementIds.homeEstablishments.heroHeader.addEstablishmentForm}`,
    );
    await page.fill(
      `#${domElementIds.homeEstablishments.siretModal.siretFetcherInput}`,
      providedSiret,
    );

    await expect(
      page.locator(
        `#${domElementIds.homeEstablishments.siretModal.editEstablishmentButton}`,
      ),
    ).toBeEnabled();

    await page.click(
      `#${domElementIds.homeEstablishments.siretModal.editEstablishmentButton}`,
    );
    await page.waitForTimeout(testConfig.timeForEventCrawler);

    // Go to admin page / go to notifications tab
    await goToAdminTab(page, "notifications");
    const emailWrapper = page
      .locator(".fr-accordion:has-text('EDIT_FORM_ESTABLISHMENT_LINK')")
      .first();
    await emailWrapper.click();
    await emailWrapper.getByRole("link", { name: "Lien vers la page" }).click();

    await page
      .locator(`#${domElementIds.establishment.edit.startFormButton}`)
      .click();
    await page.locator(".fr-radio-rich").getByText("Oui").click();

    await goToNextStep(page, 1, "edit");
    await page
      .locator(`[for="${domElementIds.establishment.edit.searchableBy}-2"]`)
      .click();
    await goToNextStep(page, 2, "edit");
    await page.fill(
      `#${domElementIds.establishment.edit.businessContact.job}`,
      faker.person.jobType(),
    );
    await page.fill(
      `#${domElementIds.establishment.edit.businessContact.phone}`,
      faker.helpers.fromRegExp(phoneRegexp),
    );
    await page.fill(
      `#${domElementIds.establishment.edit.businessContact.email}`,
      "recette+establishment-edit@immersion-facile.beta.gouv.fr",
    );

    await goToNextStep(page, 3, "edit");

    await expect(
      page.locator(`#${domElementIds.establishment.edit.siret} input`),
    ).toBeDisabled();
    await expect(
      page.locator(`#${domElementIds.establishment.edit.siret} input`),
    ).toHaveValue(providedSiret);
    await page.click(`#${domElementIds.establishment.edit.submitFormButton}`);
    await expect(page.locator(".fr-alert--success")).toBeVisible();
  });

  test("searches for an establishment", async ({ page }) => {
    await page.goto(frontRoutes.search);
    await page.fill(
      `#${domElementIds.search.placeAutocompleteInput}`,
      "Tain l",
    );
    await page
      .getByRole("option", { name: "Tain-l'Hermitage, Valence," })
      .click();
    await page.getByRole("button", { name: "Rechercher" }).click();
    const resultsSelector = `.im-search-result[data-establishment-siret="${providedSiret}"]`;
    await page.waitForSelector(resultsSelector);
    const results = await page.locator(resultsSelector);
    await expect(await results.all()).toHaveLength(1);
    await expect(results.first()).toBeVisible();
  });

  test("deletes an establishment", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await goToAdminTab(page, "establishments");
    const siretInputLocator = page.locator(
      `#${domElementIds.admin.manageEstablishment.siretInput}`,
    );
    await siretInputLocator.waitFor();
    await siretInputLocator.fill(providedSiret);
    await page.focus(
      `#${domElementIds.admin.manageEstablishment.searchButton}`,
    );
    await page.click(
      `#${domElementIds.admin.manageEstablishment.searchButton}`,
    );
    await expect(page.url()).toContain("pilotage-etablissement-admin");
    await page.click(
      `#${domElementIds.admin.manageEstablishment.submitDeleteButton}`,
    );
    await expect(page.locator(".fr-alert--success")).toBeVisible();
  });
});

const goToNextStep = async (
  page: Page,
  currentStep: 1 | 2 | 3 | 4,
  mode: "create" | "edit",
) => {
  await page
    .locator(
      `#${domElementIds.establishment[mode].nextButtonFromStepAndMode({
        currentStep,
        mode,
      })}`,
    )
    .click();
};
