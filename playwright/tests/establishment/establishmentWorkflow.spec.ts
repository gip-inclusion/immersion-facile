import { faker } from "@faker-js/faker/locale/fr";
import { expect, Page, test } from "@playwright/test";
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
    await page
      .locator(`#${domElementIds.establishment.startAddEstablishmentButton}`)
      .click();

    await page.locator(".fr-radio-rich").getByText("Oui").click();
    await page
      .locator(`#${domElementIds.establishment.maxContactsPerWeek}`)
      .fill("2");

    await goToNextStep(page, 1, "create");

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
    await page
      .locator("[for='establishment-businessContact-contactMethod-0']")
      .click();

    await goToNextStep(page, 2, "create");

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

    await page.click(
      `#${domElementIds.establishment.submitCreateEstablishmentButton}`,
    );
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
    await connectToAdmin(page);
    await goToTab(page, "Notifications");
    const emailWrapper = page
      .locator(".fr-accordion:has-text('EDIT_FORM_ESTABLISHMENT_LINK')")
      .first();
    await emailWrapper.click();
    await emailWrapper.getByRole("link", { name: "Lien vers la page" }).click();

    await page
      .locator(`#${domElementIds.establishment.startEditEstablishmentButton}`)
      .click();
    await page.locator(".fr-radio-rich").getByText("Oui").click();
    await page
      .locator(`#${domElementIds.establishment.maxContactsPerWeek}`)
      .fill("5");

    await goToNextStep(page, 1, "edit");

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

    await goToNextStep(page, 2, "edit");

    await expect(
      page.locator(`#${domElementIds.establishment.siret} input`),
    ).toBeDisabled();
    await expect(
      page.locator(`#${domElementIds.establishment.siret} input`),
    ).toHaveValue(providedSiret);
    await page.click(
      `#${domElementIds.establishment.submitEditEstablishmentButton}`,
    );
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

const goToNextStep = async (
  page: Page,
  currentStep: 1 | 2 | 3,
  mode: "create" | "edit",
) => {
  await page
    .locator(
      `#${domElementIds.establishment.nextButtonFromStepAndMode({
        currentStep,
        mode,
      })}`,
    )
    .click();
};
