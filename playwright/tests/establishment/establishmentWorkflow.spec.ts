import { faker } from "@faker-js/faker/locale/fr";
import { expect, test } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";
import { testConfig } from "../../custom.config";
import { connectToAdmin, goToTab } from "../../utils/admin";

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
    await expect(
      page.locator(`#${domElementIds.establishment.siret}`),
    ).toHaveValue(providedSiret);
    await expect(
      page.locator(`#${domElementIds.establishment.businessName}`),
    ).not.toHaveValue("");
    await expect(
      page.locator(
        `#${domElementIds.establishment.establishmentFormAddressAutocomplete}`,
      ),
    ).not.toHaveValue("");
    await page.click(`#${domElementIds.establishment.addAppellationButton}`);
    await page.fill(
      `#${domElementIds.establishment.appellations} .fr-input`,
      "boulang",
    );
    await page
      .locator(
        `#${domElementIds.establishment.appellations} .MuiAutocomplete-option`,
      )
      .first()
      .click();
    await page.fill(
      `#${domElementIds.establishment.businessContact.firstName}`,
      faker.person.firstName(),
    );
    await page.fill(
      `#${domElementIds.establishment.businessContact.lastName}`,
      faker.person.lastName(),
    );
    await page.fill(
      `#${domElementIds.establishment.businessContact.job}`,
      faker.person.jobType(),
    );
    await page.fill(
      `#${domElementIds.establishment.businessContact.phone}`,
      faker.string.numeric("06########"),
    );
    await page.fill(
      `#${domElementIds.establishment.businessContact.email}`,
      faker.internet.email(),
    );
    await page.fill(`#${domElementIds.establishment.maxContactsPerWeek}`, "1");
    await page.click(`#${domElementIds.establishment.submitButton}`);
    await expect(page.url()).toContain(`siret=${providedSiret}`);
    await expect(page.locator(".fr-alert--success")).toBeVisible();
    await page.waitForTimeout(testConfig.timeForEventCrawler);
  });

  test("modifies an existing establishment", async ({ page }) => {
    await page.goto("/");
    await page.click(`#${domElementIds.home.heroHeader.establishment}`);
    await page.click(
      `#${domElementIds.homeEstablishments.heroHeader.editEstablishmentForm}`,
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
    await connectToAdmin(page);
    await page.getByRole("tab", { name: "Notifications" }).click();
    const emailWrapper = page
      .locator(".fr-accordion:has-text('EDIT_FORM_ESTABLISHMENT_LINK')")
      .first();
    await emailWrapper.click();
    await emailWrapper.getByRole("link", { name: "Lien vers la page" }).click();
    await expect(
      page.locator(`#${domElementIds.establishment.siret} input`),
    ).toBeDisabled();
    await expect(
      page.locator(`#${domElementIds.establishment.siret} input`),
    ).toHaveValue(providedSiret);
    await page.fill(
      `#${domElementIds.establishment.businessContact.job}`,
      faker.person.jobType(),
    );
    await page.fill(
      `#${domElementIds.establishment.businessContact.phone}`,
      faker.string.numeric("06########"),
    );
    await page.fill(
      `#${domElementIds.establishment.businessContact.email}`,
      faker.internet.email(),
    );
    await page.click(`#${domElementIds.establishment.submitButton}`);
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
    await expect(
      page.locator(
        `.im-search-result[data-establishment-siret="${providedSiret}"]`,
      ),
    ).toBeVisible();
  });

  test("deletes an establishment", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await connectToAdmin(page);
    await goToTab(page, "Établissements");
    await page.fill(
      `#${domElementIds.admin.manageEstablishment.siretInput}`,
      providedSiret,
    );
    await page.focus(
      `#${domElementIds.admin.manageEstablishment.searchButton}`,
    );
    await page.click(
      `#${domElementIds.admin.manageEstablishment.searchButton}`,
    );
    await expect(page.url()).toContain(`pilotage-etablissement-admin`);
    await page.click(
      `#${domElementIds.admin.manageEstablishment.submitDeleteButton}`,
    );
    await expect(page.locator(".fr-alert--success")).toBeVisible();
  });
});
