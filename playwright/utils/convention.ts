import { faker } from "@faker-js/faker";
import { type Page, expect } from "@playwright/test";
import { addBusinessDays, format } from "date-fns";
import {
  type AgencyId,
  addressRoutes,
  domElementIds,
  frontRoutes,
  technicalRoutes,
} from "shared";
import { getMagicLinkFromEmail, goToAdminTab } from "./admin";
import { getRandomizedData } from "./data";
import {
  expectElementToBeVisible,
  expectLocatorToBeVisibleAndEnabled,
  fillAutocomplete,
  phoneRegexp,
} from "./utils";

export type ConventionSubmitted = {
  agencyId: AgencyId;
};

const beneficiaryBirthdate = faker.date
  .birthdate({
    min: 1910,
    max: 2005,
  })
  .toISOString()
  .split("T")[0];

const beneficiaryBirthdateDisplayed = format(
  new Date(beneficiaryBirthdate),
  "dd/MM/yyyy",
);

const getCurrentDate = () => format(new Date(), "yyyy-MM-dd");
const getTomorrowDate = () =>
  format(addBusinessDays(new Date(), 1), "yyyy-MM-dd");

const currentDate = getCurrentDate();
const currentDateDisplayed = format(new Date(currentDate), "dd/MM/yyyy");
const tomorrowDate = getTomorrowDate();
export const tomorrowDateDisplayed = format(
  new Date(tomorrowDate),
  "dd/MM/yyyy",
);
const updatedEndDate = format(addBusinessDays(new Date(), 3), "yyyy-MM-dd");
export const updatedEndDateDisplayed = format(
  new Date(updatedEndDate),
  "dd/MM/yyyy",
);

export const submitBasicConventionForm = async (
  page: Page,
): Promise<ConventionSubmitted | void> => {
  await page.goto(frontRoutes.initiateConvention);
  await expect(
    await page.request.get(technicalRoutes.featureFlags.url),
  ).toBeOK();
  const formButton = await page.locator(
    `#${domElementIds.initiateConvention.navCards.candidate}`,
  );
  await formButton.waitFor();
  await formButton.click();
  await page
    .locator(`#${domElementIds.initiateConvention.otherStructureButton}`)
    .click();
  await page.waitForURL(`${frontRoutes.conventionImmersionRoute}**`);
  await page.selectOption(
    `#${domElementIds.conventionImmersionRoute.conventionSection.agencyDepartment}`,
    "75",
  );
  const firstAgencyInDropdown = await page.locator(
    `#${domElementIds.conventionImmersionRoute.conventionSection.agencyId} > option:nth-child(2)`,
  );
  const agencyId: AgencyId | null =
    await firstAgencyInDropdown.getAttribute("value");
  expect(agencyId).not.toBeFalsy();
  if (!agencyId) return;
  await page.selectOption(
    `#${domElementIds.conventionImmersionRoute.conventionSection.agencyId}`,
    agencyId,
  );
  await openConventionAccordionSection(page, 1); // Open Beneficiary section
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
    "recette+beneficiary@immersion-facile.beta.gouv.fr",
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.beneficiarySection.phone}`,
    faker.helpers.fromRegExp(phoneRegexp),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.beneficiarySection.birthdate}`,
    beneficiaryBirthdate,
  );
  await openConventionAccordionSection(page, 2); // Open Establishment section
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.conventionSection.siret}`,
    getRandomSiret(),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.establishmentRepresentativeSection.firstName}`,
    faker.person.firstName(),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.establishmentRepresentativeSection.lastName}`,
    faker.person.lastName(),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.establishmentRepresentativeSection.phone}`,
    faker.helpers.fromRegExp(phoneRegexp),
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.establishmentRepresentativeSection.email}`,
    "recette+establishment-tutor@immersion-facile.beta.gouv.fr",
  );
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.job}`,
    faker.person.jobType(),
  );
  await openConventionAccordionSection(page, 3); // Open place / hour section
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.conventionSection.dateStart}`,
    currentDate,
  );
  await page.focus(
    `#${domElementIds.conventionImmersionRoute.conventionSection.dateEnd}`,
  );
  await expect(
    page.locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.dateStart}`,
    ),
  ).toHaveValue(currentDate);
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.conventionSection.dateEnd}`,
    tomorrowDate,
  );
  await page.click(
    `#${domElementIds.conventionImmersionRoute.conventionSection.addHoursButton}`,
  );

  await fillAutocomplete({
    page,
    locator: `#${domElementIds.conventionImmersionRoute.conventionSection.immersionAddress}`,
    value: getRandomizedData("addressQueries"),
    endpoint: addressRoutes.lookupStreetAddress.url,
  });

  await expect(
    page.locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.dateEnd}`,
    ),
  ).toHaveValue(tomorrowDate);
  await openConventionAccordionSection(page, 4); // Open immersion details section

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
    value: getRandomizedData("jobs"),
  });
  await page.fill(
    `#${domElementIds.conventionImmersionRoute.conventionSection.immersionActivities}`,
    faker.word.words(8),
  );
  await confirmCreateConventionFormSubmit(page, tomorrowDateDisplayed);

  return {
    agencyId,
  };
};

export const signConvention = async (
  page: Page,
  magicLinks: string[],
  signatoryIndex: number,
  dateEndDisplayed: string,
) => {
  await page.goto(magicLinks[signatoryIndex]);
  await expect(page.locator(".fr-alert--success")).toBeHidden();

  await checkConventionSummary(page, dateEndDisplayed);

  await expectLocatorToBeVisibleAndEnabled(
    await page.locator(
      `#${domElementIds.conventionToSign.openSignModalButton}`,
    ),
  );

  await page.click(`#${domElementIds.conventionToSign.openSignModalButton}`);

  await expectLocatorToBeVisibleAndEnabled(
    await page.locator(`#${domElementIds.conventionToSign.submitButton}`),
  );
  await page.click(`#${domElementIds.conventionToSign.submitButton}`);
  await expect(page.locator(".fr-alert--success")).toBeVisible();
};

export const allOtherSignatoriesSignConvention = async ({
  page,
  expectedConventionEndDate,
}: {
  page: Page;
  expectedConventionEndDate: string;
}) => {
  const signatoriesMagicLinks: string[] = [];
  await page.goto("/");
  await goToAdminTab(page, "adminNotifications");
  const allOtherSignatoriesCount = 3;
  for (let index = 0; index < allOtherSignatoriesCount; index++) {
    const href = await getMagicLinkFromEmail({
      page,
      emailType: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
      elementIndex: index,
      label: "conventionSignShortlink",
    });
    if (href) {
      signatoriesMagicLinks.push(href);
    }
  }
  await Promise.all(
    signatoriesMagicLinks.map((href, index) =>
      signConvention(page, [href], index, expectedConventionEndDate),
    ),
  );
};

export const submitEditConventionForm = async (
  page: Page,
  conventionSubmitted: ConventionSubmitted | void,
) => {
  const agencyIdSelect = page.locator(
    `#${domElementIds.conventionImmersionRoute.conventionSection.agencyId}`,
  );
  await agencyIdSelect.locator("option").locator("nth=1").waitFor({
    state: "hidden",
  });
  expect(conventionSubmitted).not.toBeUndefined();
  if (conventionSubmitted?.agencyId) {
    await expect(
      page.locator(
        `#${domElementIds.conventionImmersionRoute.conventionSection.agencyId}`,
      ),
    ).toHaveValue(conventionSubmitted.agencyId);
  }
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
    .fill("recette+beneficiary-rep@immersion-facile.beta.gouv.fr");
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryRepresentativeSection.phone}`,
    )
    .fill(faker.helpers.fromRegExp(phoneRegexp));
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
    value: getRandomizedData("addressQueries"),
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
    .fill(faker.helpers.fromRegExp(phoneRegexp));
  await page
    .locator(
      `#${domElementIds.conventionImmersionRoute.beneficiaryCurrentEmployerSection.email}`,
    )
    .fill("recette+current-employer@immersion-facile.beta.gouv.fr");

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
    .fill(updatedEndDate);

  await expect(
    page.locator(
      `#${domElementIds.conventionImmersionRoute.conventionSection.dateEnd}`,
    ),
  ).toHaveValue(updatedEndDate);

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
  await expectElementToBeVisible(page, ".im-convention-summary__section");
  await expect(
    await page
      .locator(".im-convention-summary__section", {
        has: page.getByText("Signataires de la convention"),
      })
      .getByText("Employeur actuel du bénéficiaire"),
  ).toBeVisible();
  await expect(
    await page
      .locator(".im-convention-summary__section", {
        has: page.getByText("Signataires de la convention"),
      })
      .getByText("Employeur actuel"),
  ).toBeVisible();

  await page.fill(
    `#${domElementIds.conventionImmersionRoute.statusJustificationInput}`,
    "justification de la modification",
  );

  await page.click(
    `#${domElementIds.conventionImmersionRoute.confirmSubmitFormButton}`,
  );

  await expectElementToBeVisible(page, ".fr-alert--success");
  await expect(page.locator(".fr-alert--error").first()).not.toBeVisible();
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

export const checkConventionSummary = async (
  page: Page,
  dateEndDisplayed: string,
) => {
  await expectElementToBeVisible(page, ".im-convention-summary__section");
  await expect(
    await page
      .locator(".im-convention-summary__section", {
        has: page.getByText("Signataires de la convention"),
      })
      .getByText("Bénéficiaire", { exact: true }),
  ).toBeVisible();
  await expect(
    await page
      .locator(".im-convention-summary__section", {
        has: page.getByText("Signataires de la convention"),
      })
      .getByText("Représentant de l'entreprise"),
  ).toBeVisible();
  await expect(
    await page
      .locator("#im-convention-summary__subsection__value-beneficiaryBirthdate")
      .textContent(),
  ).toContain(beneficiaryBirthdateDisplayed);
  await expect(
    await page
      .locator("#im-convention-summary__subsection__value-dateStart")
      .textContent(),
  ).toContain(currentDateDisplayed);
  await expect(
    await page
      .locator("#im-convention-summary__subsection__value-dateEnd")
      .textContent(),
  ).toContain(dateEndDisplayed);
};

export const confirmCreateConventionFormSubmit = async (
  page: Page,
  dateEndDisplayed: string,
) => {
  await page.click(
    `#${domElementIds.conventionImmersionRoute.submitFormButton}`,
  );
  await checkConventionSummary(page, dateEndDisplayed);

  await page.click(
    `#${domElementIds.conventionImmersionRoute.confirmSubmitFormButton}`,
  );
  await expectElementToBeVisible(page, ".im-submit-confirmation-section");
};

const getRandomSiret = () =>
  ["722 003 936 02320", "44229377500031", "130 005 481 00010"][
    Math.floor(Math.random() * 3)
  ];
