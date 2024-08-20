import { faker } from "@faker-js/faker/locale/fr";
import { Page, expect, test } from "@playwright/test";
import { addMonths } from "date-fns";
import {
  FormEstablishmentDto,
  domElementIds,
  frontRoutes,
  toDisplayedDate,
} from "shared";
import { testConfig } from "../../custom.config";
import { goToAdminTab } from "../../utils/admin";
import {
  expectLocatorToBeVisibleAndEnabled,
  fillAutocomplete,
  phoneRegexp,
} from "../../utils/utils";

test.describe.configure({ mode: "serial" });
const providedSiret = "41433740200039";

test.describe("Establishment creation and modification workflow", () => {
  const updatedInformations = {
    businessNameCustomized: faker.company.name(),
    additionalInformation: faker.lorem.sentence(),
    maxContactsPerMonth: faker.number.int({ min: 1, max: 10 }),
    businessContact: {
      job: faker.person.jobType(),
      phone: faker.helpers.fromRegExp(phoneRegexp),
      email: "recette+updated-establishment@immersion-facile.beta.gouv.fr",
      contactMethod: "PHONE",
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      copyEmails: [
        "recette+copy-updated-establishment@immersion-facile.beta.gouv.fr",
      ],
    },
    searchableBy: {
      students: false,
      jobSeekers: true,
    },
    nextAvailabilityDate: addMonths(new Date(), 1).toISOString(),
    appellations: [],
    businessAddresses: [
      {
        id: "fake-id",
        rawAddress: "6 rue de la chaîne 86000 Poitiers",
      },
    ],
    website: faker.internet.domainName(),
    fitForDisabledWorkers: true,
    isEngagedEnterprise: true,
  } satisfies Partial<FormEstablishmentDto>;
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
    const addEstablishmentButton = await page.locator(
      `#${domElementIds.establishment.create.startFormButton}`,
    );

    await expectLocatorToBeVisibleAndEnabled(addEstablishmentButton);

    await addEstablishmentButton.click();

    await page.locator(".fr-radio-rich").getByText("Oui").click();

    await goToNextStep(page, 1, "create");
    await page
      .locator(`[for="${domElementIds.establishment.create.searchableBy}-2"]`) // searchable by students
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

  test.describe("Establishment admin get notifications magic links", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test("modifies an existing establishment", async ({ page }) => {
      // Get edit link
      await page.goto("/");
      await page.click(`#${domElementIds.home.heroHeader.establishment}`);
      await page.click(
        `#${domElementIds.homeEstablishments.heroHeader.addEstablishmentForm}`,
      );
      await page.fill(
        `#${domElementIds.homeEstablishments.siretModal.siretFetcherInput}`,
        providedSiret,
      );

      await expectLocatorToBeVisibleAndEnabled(
        await page.locator(
          `#${domElementIds.homeEstablishments.siretModal.editEstablishmentButton}`,
        ),
      );

      await page.click(
        `#${domElementIds.homeEstablishments.siretModal.editEstablishmentButton}`,
      );
      await page.waitForTimeout(testConfig.timeForEventCrawler);
      await closeModal(page);
      // Go to admin page / go to notifications tab
      await goToAdminTab(page, "notifications");
      const emailWrapper = page
        .locator(".fr-accordion:has-text('EDIT_FORM_ESTABLISHMENT_LINK')")
        .first();
      await emailWrapper.click();
      await emailWrapper
        .getByRole("link", { name: "Lien vers la page" })
        .click();

      await page.waitForTimeout(4_000);

      // Edit establishment
      const startFormButtonLocator = await page.locator(
        `#${domElementIds.establishment.edit.startFormButton}`,
      );
      await expectLocatorToBeVisibleAndEnabled(startFormButtonLocator);

      await startFormButtonLocator.click();
      await page.locator(".fr-radio-rich").getByText("Non").click();
      await page
        .locator(
          `#${domElementIds.establishment.edit.nextAvailabilityDateInput}`,
        )
        .fill(updatedInformations.nextAvailabilityDate.split("T")[0]);
      await page.fill(
        `#${domElementIds.establishment.edit.maxContactsPerMonth}`,
        updatedInformations.maxContactsPerMonth.toString(),
      );

      await goToNextStep(page, 1, "edit");
      await page
        .locator(
          `[for="${domElementIds.establishment.edit.searchableBy}-1"]`, // job seekers
        )
        .click();
      await goToNextStep(page, 2, "edit");
      await page.fill(
        `#${domElementIds.establishment.edit.businessContact.firstName}`,
        updatedInformations.businessContact.firstName,
      );

      await page.fill(
        `#${domElementIds.establishment.edit.businessContact.lastName}`,
        updatedInformations.businessContact.lastName,
      );

      await page.fill(
        `#${domElementIds.establishment.edit.businessContact.job}`,
        updatedInformations.businessContact.job,
      );

      await page.fill(
        `#${domElementIds.establishment.edit.businessContact.phone}`,
        updatedInformations.businessContact.phone,
      );

      await page.fill(
        `#${domElementIds.establishment.edit.businessContact.email}`,
        updatedInformations.businessContact.email,
      );

      await page
        .locator(
          `[for='${domElementIds.establishment.edit.businessContact.contactMethod}-1']`,
        )
        .click();

      await goToNextStep(page, 3, "edit");

      await expect(
        page.locator(`#${domElementIds.establishment.edit.siret} input`),
      ).toBeDisabled();
      await expect(
        page.locator(`#${domElementIds.establishment.edit.siret} input`),
      ).toHaveValue(providedSiret);

      await page.fill(
        `#${domElementIds.establishment.edit.businessNameCustomized}`,
        updatedInformations.businessNameCustomized,
      );

      await page.click(
        `[for=${domElementIds.establishment.edit.isEngagedEnterprise}-${
          updatedInformations.isEngagedEnterprise ? "1" : "0"
        }]`,
      );

      await page.click(
        `[for=${domElementIds.establishment.edit.fitForDisabledWorkers}-${
          updatedInformations.fitForDisabledWorkers ? "1" : "0"
        }]`,
      );

      await page.fill(
        `#${domElementIds.establishment.edit.additionalInformation}`,
        updatedInformations.additionalInformation,
      );

      await page.fill(
        `#${domElementIds.establishment.edit.website}`,
        updatedInformations.website,
      );

      await page.click(
        `#${domElementIds.establishment.edit.businessAddresses}-delete-option-button-0`,
      );
      await page.click(
        `#${domElementIds.establishment.edit.businessAddresses}-delete-option-button-0`,
      ); // twice, to remove the second address

      await page.fill(
        `#${domElementIds.establishment.edit.appellations} .fr-input`,
        "buchero",
      );
      await page
        .locator(
          `#${domElementIds.establishment.edit.appellations} .MuiAutocomplete-option`,
        )
        .first()
        .click();

      await fillAutocomplete({
        page,
        locator: `#${domElementIds.establishment.edit.businessAddresses}-0`,
        value: updatedInformations.businessAddresses[0].rawAddress,
      });
      await page.click(`#${domElementIds.establishment.edit.submitFormButton}`);
      await expect(page.locator(".fr-alert--success")).toBeVisible();
      await page.waitForTimeout(testConfig.timeForEventCrawler);
    });
    test("check that establishment has been updated", async ({ page }) => {
      // Check if the establishment has been updated
      await page.goto("/");
      await goToAdminTab(page, "establishments");
      await page.fill(
        `#${domElementIds.admin.manageEstablishment.siretInput}`,
        providedSiret,
      );
      await page.click(
        `#${domElementIds.admin.manageEstablishment.searchButton}`,
      );
      await page.waitForTimeout(1000); // waiting for fetch and render
      await expect(
        await page
          .locator(
            `#${domElementIds.establishment.admin.maxContactsPerMonthValue}`,
          )
          .textContent(),
      ).toBe(updatedInformations.maxContactsPerMonth.toString());

      await expect(
        await page
          .locator(
            `#${domElementIds.establishment.admin.nextAvailabilityDateValue}`,
          )
          .textContent(),
      ).toBe(
        toDisplayedDate({
          date: new Date(updatedInformations.nextAvailabilityDate),
        }),
      );

      await expect(
        await page
          .locator(
            `#${domElementIds.establishment.admin.businessNameCustomized}`,
          )
          .inputValue(),
      ).toBe(updatedInformations.businessNameCustomized);

      await expect(
        await page.locator(
          `#${domElementIds.establishment.admin.searchableBy}-1`,
        ),
      ).toBeChecked();

      await expect(
        await page
          .locator(
            `#${domElementIds.establishment.admin.businessContact.firstName}`,
          )
          .inputValue(),
      ).toBe(updatedInformations.businessContact.firstName);

      await expect(
        await page
          .locator(
            `#${domElementIds.establishment.admin.businessContact.lastName}`,
          )
          .inputValue(),
      ).toBe(updatedInformations.businessContact.lastName);

      await expect(
        await page
          .locator(`#${domElementIds.establishment.admin.businessContact.job}`)
          .inputValue(),
      ).toBe(updatedInformations.businessContact.job);

      await expect(
        await page
          .locator(
            `#${domElementIds.establishment.admin.businessContact.phone}`,
          )
          .inputValue(),
      ).toContain(updatedInformations.businessContact.phone.substring(1));

      await expect(
        await page
          .locator(
            `#${domElementIds.establishment.admin.businessContact.email}`,
          )
          .inputValue(),
      ).toBe(updatedInformations.businessContact.email);

      await expect(
        await page.locator(
          `#${domElementIds.establishment.admin.businessContact.contactMethod}-1`,
        ),
      ).toBeChecked();

      await expect(
        (
          await page
            .locator(
              `#${domElementIds.establishment.admin.businessAddresses}-0`,
            )
            .inputValue()
        ).toLowerCase(),
      ).toBe(updatedInformations.businessAddresses[0].rawAddress.toLowerCase());

      await expect(
        await page
          .locator(`#${domElementIds.establishment.admin.appellations} input`)
          .inputValue(),
      ).toContain("Bûcheron");

      await expect(
        await page.locator(
          `#${domElementIds.establishment.admin.fitForDisabledWorkers}-${
            updatedInformations.fitForDisabledWorkers ? "1" : "0"
          }`,
        ),
      ).toBeChecked();

      await expect(
        await page.locator(
          `#${domElementIds.establishment.admin.isEngagedEnterprise}-${
            updatedInformations.isEngagedEnterprise ? "1" : "0"
          }`,
        ),
      ).toBeChecked();

      await expect(
        await page
          .locator(`#${domElementIds.establishment.admin.website}`)
          .inputValue(),
      ).toBe(updatedInformations.website);

      await expect(
        await page
          .locator(
            `#${domElementIds.establishment.admin.additionalInformation}`,
          )
          .inputValue(),
      ).toBe(updatedInformations.additionalInformation);
    });
  });

  test("searches for non available establishment", async ({ page }) => {
    await page.goto(frontRoutes.search);
    await page.fill(
      `#${domElementIds.search.placeAutocompleteInput}`,
      "Poitiers",
    );
    await page
      .getByRole("option", {
        name: "Poitiers, Nouvelle-Aquitaine, France",
      })
      .first()
      .click();
    await page.getByRole("button", { name: "Rechercher" }).click();
    const resultsSelector = `.im-search-result[data-establishment-siret="${providedSiret}"]`;
    await expect(await page.locator(resultsSelector)).toHaveCount(0);
  });

  test.describe("Admin makes the establishment available", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test("make the establishment available", async ({ page }) => {
      await page.goto("/");
      await goToAdminTab(page, "establishments");
      await page.fill(
        `#${domElementIds.admin.manageEstablishment.siretInput}`,
        providedSiret,
      );
      await page.click(
        `#${domElementIds.admin.manageEstablishment.searchButton}`,
      );
      await page.locator(".fr-radio-rich").getByText("Oui").click();
      await page.click(
        `#${domElementIds.establishment.admin.submitFormButton}`,
      );
      await expect(page.locator(".fr-alert--success")).toBeVisible();
    });
  });

  test("searches for available establishment", async ({ page }) => {
    await page.goto(frontRoutes.search);
    await page.fill(
      `#${domElementIds.search.placeAutocompleteInput}`,
      "Poitiers",
    );
    await page
      .getByRole("option", {
        name: "Poitiers, Nouvelle-Aquitaine, France",
      })
      .first()
      .click();
    await page.getByRole("button", { name: "Rechercher" }).click();
    const resultsSelector = `#${domElementIds.search.searchResultButton}-${providedSiret}`;
    await expect(await page.locator(resultsSelector)).toHaveCount(1);
  });

  test.describe("Admin deletes an establishment", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test("deletes an establishment", async ({ page }) => {
      page.on("dialog", (dialog) => dialog.accept());
      await page.goto("/");
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

const closeModal = async (page: Page) => {
  await page.locator("#siret .fr-btn--close").click();
};
