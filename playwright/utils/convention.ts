import { faker } from "@faker-js/faker";
import { Page, expect } from "@playwright/test";
import { addBusinessDays, format } from "date-fns";
import {
  domElementIds,
  frontRoutes,
  peParisAgencyId,
  technicalRoutes,
} from "shared";
import { possibleAddressQueries, possibleJobs } from "./data";
import { expectElementToBeVisible, fillAutocomplete } from "./utils";

let currentStep = 1;

export const submitBasicConventionForm = async (page: Page) => {
  await page.goto(frontRoutes.conventionImmersionRoute);
  await expect(
    await page.request.get(technicalRoutes.featureFlags.url),
  ).toBeOK();
  const formButton = await page.locator(
    `#${domElementIds.conventionImmersionRoute.showFormButton}`,
  );
  await formButton.waitFor();
  await formButton.click();
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
  await fillAutocomplete({
    page,
    locator: `#${domElementIds.conventionImmersionRoute.conventionSection.immersionAddress}`,
    value:
      possibleAddressQueries[
        Math.floor(Math.random() * possibleAddressQueries.length)
      ],
  });

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
  await fillAutocomplete({
    page,
    locator: `#${domElementIds.conventionImmersionRoute.conventionSection.immersionAppellation}`,
    value: possibleJobs[Math.floor(Math.random() * possibleJobs.length)],
  });
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.conventionSection.immersionActivities}`,
    faker.word.words(8),
  );
  await confirmCreateConventionFormSubmit(page);
};

export const signConvention = async (page: Page, magicLink: string) => {
  // eslint-disable-next-line no-console
  console.info("Signing convention with magic link ==>", magicLink);

  await page.goto(magicLink);
  await expect(page.locator(".fr-alert--success")).toBeHidden();
  await expect(
    page.locator(`#${domElementIds.conventionToSign.openSignModalButton}`),
  ).toBeVisible();
  await expect(
    page.locator(`#${domElementIds.conventionToSign.openSignModalButton}`),
  ).toBeEnabled();
  await page.click(`#${domElementIds.conventionToSign.openSignModalButton}`);
  await expect(
    page.locator(`#${domElementIds.conventionToSign.submitButton}`),
  ).toBeEnabled();
  await page.click(`#${domElementIds.conventionToSign.submitButton}`);
  await expect(page.locator(".fr-alert--success")).toBeVisible();
};

export const submitEditConventionForm = async (
  page: Page,
  magicLink: string,
) => {
  await page.goto(magicLink);
  const agencyIdSelect = page.locator(
    `#${domElementIds.conventionImmersionRoute.conventionSection.agencyId}`,
  );
  await agencyIdSelect.locator("option").locator("nth=1").waitFor({
    state: "hidden",
  });
  await expect(
    page.locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.agencyId}`,
    ),
  ).toHaveValue(peParisAgencyId);
  await openConventionAccordionSection(page, 1);
  await page
    .locator(
      `[for='${domElementIds.conventionImmersionRoute.conventionSection.isMinor}-0']`,
    )
    .click();
  await expect(
    page.locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryRepresentativeSection.firstName}`,
    ),
  ).toBeVisible();
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryRepresentativeSection.firstName}`,
    )
    .fill(faker.person.firstName());
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryRepresentativeSection.lastName}`,
    )
    .fill(faker.person.lastName());
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryRepresentativeSection.email}`,
    )
    .fill(faker.internet.email());
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryRepresentativeSection.phone}`,
    )
    .fill(faker.string.numeric("05########"));
  await page
    .locator(
      `[for='${domElementIds.conventionImmersionRoute.conventionSection.isCurrentEmployer}-0']`,
    )
    .click();
  await expect(
    page.locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryCurrentEmployerSection.businessSiret}`,
    ),
  ).toBeVisible();
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryCurrentEmployerSection.businessSiret}`,
    )
    .fill(faker.string.numeric("XXXXXXXXXXXXXX"));
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryCurrentEmployerSection.businessName}`,
    )
    .fill(faker.company.name());
  await fillAutocomplete({
    page,
    locator: `#${domElementIds.conventionImmersionRoute.beneficiaryCurrentEmployerSection.businessAddress}`,
    value:
      possibleAddressQueries[
        Math.floor(Math.random() * possibleAddressQueries.length)
      ],
  });
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryCurrentEmployerSection.firstName}`,
    )
    .fill(faker.person.firstName());
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryCurrentEmployerSection.lastName}`,
    )
    .fill(faker.person.lastName());
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryCurrentEmployerSection.job}`,
    )
    .fill(faker.person.jobType());
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryCurrentEmployerSection.phone}`,
    )
    .fill(faker.string.numeric("05########"));
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryCurrentEmployerSection.email}`,
    )
    .fill(faker.internet.email());

  await openConventionAccordionSection(page, 2);
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.job}`,
    )
    .fill("Edited job");
  await openConventionAccordionSection(page, 3);
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.dateEnd}`,
    )
    .fill(format(addBusinessDays(new Date(), 3), "yyyy-MM-dd"));

  await page
    .locator(".schedule-picker__day-circle")
    .getByRole("button", { disabled: false })
    .all()
    .then((buttons) => buttons[0].click());

  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.addHoursButton}`,
    )
    .click();
  await page
    .locator(`#${domElementIds.conventionImmersionRoute.submitFormButton}`)
    .click();
  await expect(page.locator(".fr-alert--error")).not.toBeVisible();
  await expectElementToBeVisible(page, ".im-convention-summary");
  await expect(
    await page.locator(".im-convention-summary__signatory-section").all(),
  ).toHaveLength(4);
  await expect(
    await page
      .locator(".im-convention-summary__signatory-section")
      .getByText("Représentant du bénéficiaire"),
  ).toBeVisible();
  await expect(
    await page
      .locator(".im-convention-summary__signatory-section")
      .getByText("Employeur actuel"),
  ).toBeVisible();

  await page.click(
    `#${domElementIds.conventionImmersionRoute.confirmSubmitFormButton}`,
  );
  await expectElementToBeVisible(page, ".im-submit-confirmation-section");
};

export const openConventionAccordionSection = async (
  page: Page,
  sectionIndex: number,
) => {
  await page
    .locator(".fr-accordion")
    .nth(sectionIndex)
    .locator(".fr-accordion__btn")
    .click();
};

export const confirmCreateConventionFormSubmit = async (page: Page) => {
  await page.click(
    `#${domElementIds.conventionImmersionRoute.submitFormButton}`,
  );
  await expectElementToBeVisible(page, ".im-convention-summary");
  await expect(page.locator(".im-convention-summary")).toBeVisible();
  await expect(
    await page.locator(".im-convention-summary__signatory-section").all(),
  ).toHaveLength(2);
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
