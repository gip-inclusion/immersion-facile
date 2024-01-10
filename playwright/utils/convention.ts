import { faker } from "@faker-js/faker";
import { expect, Page } from "@playwright/test";
import { addBusinessDays, format } from "date-fns";
import { domElementIds, frontRoutes, peParisAgencyId } from "shared";

const possibleJobs = [
  "Aide à domicile",
  "Aide-soignant",
  "Ambulancier",
  "Boulanger",
  "Boucher",
  "Jongleur",
  "Pompier",
  "Pâtissier",
  "Plombier",
  "Serrurier",
];
const possibleAddressQueries = [
  "1 rue de la paix",
  "rue des mimosas",
  "avenue des champs elysées",
  "rue de la république",
];

let currentStep = 1;

export const submitBasicConventionForm = async (page: Page) => {
  await page.goto(frontRoutes.conventionImmersionRoute);
  await page.click(`#${domElementIds.conventionImmersionRoute.showFormButton}`);
  await page.selectOption(
    `#${domElementIds.conventionImmersionRoute.conventionSection.agencyDepartment}`,
    "75",
  );
  await page.selectOption(
    `#${domElementIds.conventionImmersionRoute.conventionSection.agencyId}`,
    peParisAgencyId,
  );
  await openNextSection(page); // Open Beneficiary section
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.beneficiarySection.firstName}`,
    faker.person.firstName(),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.beneficiarySection.lastName}`,
    faker.person.lastName(),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.beneficiarySection.email}`,
    faker.internet.email(),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.beneficiarySection.phone}`,
    faker.string.numeric("06########"),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.beneficiarySection.birthdate}`,
    faker.date
      .birthdate({
        min: 18,
        max: 65,
      })
      .toISOString()
      .split("T")[0],
  );
  await openNextSection(page); // Open Establishment section
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.conventionSection.siret}`,
    getRandomSiret(),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.firstName}`,
    faker.person.firstName(),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.lastName}`,
    faker.person.lastName(),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.job}`,
    faker.person.jobType(),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.phone}`,
    faker.string.numeric("05########"),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.email}`,
    faker.internet.email(),
  );
  await openNextSection(page); // Open place / hour section
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.conventionSection.dateStart}`,
    getCurrentDate(),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.conventionSection.dateEnd}`,
    getTomorrowDate(),
  );
  await page.click(
    `#${domElementIds.conventionImmersionRoute.conventionSection.addHoursButton}`,
  );
  await fillAutocomplete(
    page,
    `#${domElementIds.conventionImmersionRoute.conventionSection.immersionAddress}`,
    possibleAddressQueries[
      Math.floor(Math.random() * possibleAddressQueries.length)
    ],
  );

  await openNextSection(page); // Open immersion details section

  await page.click(
    `[for="${domElementIds.conventionImmersionRoute.conventionSection.individualProtection}-0"]`,
  );
  await page.click(
    `[for="${domElementIds.conventionImmersionRoute.conventionSection.sanitaryPrevention}-0"]`,
  );
  await page.click(
    `[for="${domElementIds.conventionImmersionRoute.conventionSection.immersionObjective}-1"]`,
  );
  await fillAutocomplete(
    page,
    `#${domElementIds.conventionImmersionRoute.conventionSection.immersionAppellation}`,
    possibleJobs[Math.floor(Math.random() * possibleJobs.length)],
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.conventionSection.immersionActivities}`,
    faker.word.words(8),
  );
  await page.click(
    `#${domElementIds.conventionImmersionRoute.submitFormButton}`,
  );
  await expectElementToBeVisible(page, ".im-convention-summary");
  await expect(page.locator(".im-convention-summary")).toBeVisible();
  await page.click(
    `#${domElementIds.conventionImmersionRoute.confirmSubmitFormButton}`,
  );
  await expectElementToBeVisible(page, ".im-submit-confirmation-section");
};

const getCurrentDate = () => format(new Date(), "yyyy-MM-dd");
const getTomorrowDate = () =>
  format(addBusinessDays(new Date(), 1), "yyyy-MM-dd");

const getRandomSiret = () =>
  ["722 003 936 02320", "44229377500031", "130 005 481 00010"][
    Math.floor(Math.random() * 3)
  ];

const openNextSection = async (page: Page) => {
  await page
    .locator(".fr-accordion")
    .nth(currentStep)
    .locator(".fr-accordion__btn")
    .click();
  currentStep++;
};

const fillAutocomplete = async (page: Page, locator: string, value: string) => {
  await page.locator(locator).fill(value);
  await page.waitForSelector(`${locator}[aria-controls]`);
  const listboxId = await page.locator(locator).getAttribute("aria-controls");
  await expect(
    page.locator(`#${listboxId} .MuiAutocomplete-option`).nth(0),
  ).toBeVisible();
  await page.locator(`#${listboxId} .MuiAutocomplete-option`).nth(0).click();
};

export const signConvention = async (page: Page, magicLink: string) => {
  await page.goto(magicLink);
  await expect(page.locator(".fr-alert--success")).toBeHidden();
  await page.click(`#${domElementIds.conventionToSign.openSignModalButton}`);
  await expect(
    page.locator(`#${domElementIds.conventionToSign.submitButton}`),
  ).toBeEnabled();
  await page.click(`#${domElementIds.conventionToSign.submitButton}`);
  await expect(page.locator(".fr-alert--success")).toBeVisible();
};

export const editConventionForm = async (page: Page, magicLink: string) => {
  await page.goto(magicLink);
  await expect(
    page.locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.agencyId}`,
    ),
  ).toHaveValue(peParisAgencyId);
  await page
    .locator(`.fr-accordion`)
    .nth(2)
    .locator(".fr-accordion__btn")
    .click();
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.job}`,
    )
    .fill("Edited job");
  await page
    .locator(`.fr-accordion`)
    .nth(3)
    .locator(".fr-accordion__btn")
    .click();
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.dateEnd}`,
    )
    .fill(format(addBusinessDays(new Date(), 5), "yyyy-MM-dd"));
  await expect(
    page
      .locator(".schedule-picker")
      .getByRole("button", { name: "J", exact: true }),
  ).toBeEnabled();
  await expect(
    page
      .locator(".schedule-picker")
      .getByRole("button", { name: "V", exact: true }),
  ).toBeEnabled();
  await page
    .locator(".schedule-picker")
    .getByRole("button", { name: "J", exact: true })
    .click();
  await page
    .locator(".schedule-picker")
    .getByRole("button", { name: "V", exact: true })
    .click();
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.addHoursButton}`,
    )
    .click();
  await page
    .locator(`#${domElementIds.conventionImmersionRoute.submitFormButton}`)
    .click();
  await expectElementToBeVisible(page, ".im-convention-summary");
  await page.click(
    `#${domElementIds.conventionImmersionRoute.confirmSubmitFormButton}`,
  );
  await expectElementToBeVisible(page, ".im-submit-confirmation-section");
};

const expectElementToBeVisible = async (page: Page, selector: string) => {
  const confirmation = await page.locator(selector);
  await confirmation.waitFor();
  await expect(confirmation).toBeVisible();
};
