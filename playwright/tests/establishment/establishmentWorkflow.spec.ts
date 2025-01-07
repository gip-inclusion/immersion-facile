import { faker } from "@faker-js/faker/locale/fr";
import { expect, test } from "@playwright/test";
import { addMonths } from "date-fns";
import { FormEstablishmentDto, domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import { phoneRegexp } from "../../utils/utils";
import { createNewEstablishment } from "./createNewEstablishment";
import {
  TestEstablishments,
  fillEstablishmentFormFirstStep,
} from "./establishmentForm.utils";
import { goToManageEtablishmentBySiretInAdmin as goToManageEtablishmentInBackOfficeAdmin } from "./establishmentNavigation.utils";
import {
  checkAvailabilityThoughBackOfficeAdmin,
  checkAvailabilityThoughEstablishmentDashboard,
  checkEstablishmentUpdatedThroughBackOfficeAdmin,
  deleteEstablishmentInBackOfficeAdmin,
} from "./manageEstablishment";
import {
  updateEstablishmentAvailabilityThroughBackOfficeAdmin,
  updateEstablishmentThroughMagicLink,
} from "./modifyEstablishment";
import { searchEstablishmentAndExpectResultToHaveLength } from "./searchEstablishment";

test.describe.configure({ mode: "serial" });

test.describe("Establishment creation and modification workflow", () => {
  const testEstablishments: TestEstablishments = [
    {
      siret: "41433740200039",
      expectedAddress: "Avenue des Grands Crus 26600 Tain-l'Hermitage",
    },
    {
      siret: "21590350100017",
      expectedAddress: "Place Augustin Laurent 59000 Lille",
    },
    {
      siret: "21310555400017",
      expectedAddress: "1 Place du Capitole 31000 Toulouse",
    },
  ];

  const initialEstablishmentInformations: Partial<FormEstablishmentDto> = {
    businessContact: {
      job: faker.person.jobType(),
      phone: faker.helpers.fromRegExp(phoneRegexp),
      email: "recette+initial-establishment@immersion-facile.beta.gouv.fr",
      contactMethod: "PHONE",
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      copyEmails: [
        "recette+copy-updated-establishment1@immersion-facile.beta.gouv.fr",
      ],
    },
  };

  const updatedInformations: Partial<FormEstablishmentDto> = {
    businessNameCustomized: faker.company.name(),
    additionalInformation: faker.lorem.sentence(),
    maxContactsPerMonth: faker.number.int({ min: 1, max: 10 }),
    businessContact: {
      job: faker.person.jobType(),
      phone: faker.helpers.fromRegExp(phoneRegexp),
      email: "admin+playwright@immersion-facile.beta.gouv.fr", //admin email required due to connexion to Establishment Dashboard
      contactMethod: "PHONE",
      firstName: "Prénom Admin",
      lastName: "Nom Admin",
      copyEmails: [
        "recette+copy-updated-establishment2@immersion-facile.beta.gouv.fr",
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
    website: `https://${faker.internet.domainName()}`,
    fitForDisabledWorkers: true,
    isEngagedEnterprise: true,
  };

  test(
    "creates a new establishment",
    createNewEstablishment(
      initialEstablishmentInformations,
      testEstablishments,
    ),
  );

  test.describe("Update establishment through magic link", () => {
    test.use({ storageState: testConfig.adminAuthFile });

    test(
      "modifies an existing establishment through magic link",
      updateEstablishmentThroughMagicLink(
        updatedInformations,
        testEstablishments,
      ),
    );

    test(
      "check that establishment has been updated through backoffice admin",
      checkEstablishmentUpdatedThroughBackOfficeAdmin(
        updatedInformations,
        testEstablishments,
      ),
    );
  });

  test(
    "searches for non available establishment",
    searchEstablishmentAndExpectResultToHaveLength(testEstablishments, 0),
  );

  test.describe("Admin makes the establishment available", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test(
      "make the establishment available",
      updateEstablishmentAvailabilityThroughBackOfficeAdmin(testEstablishments),
    );
  });

  test(
    "searches for available establishment",
    searchEstablishmentAndExpectResultToHaveLength(testEstablishments, 1),
  );

  test.describe("Check displayed availability", () => {
    test.use({ storageState: testConfig.adminAuthFile });

    test("in create establishment form - defaults values", async ({ page }) => {
      const siretForAvailabilityCheck = "88462068300018";
      await fillEstablishmentFormFirstStep(page, siretForAvailabilityCheck);
      const initialRadioButton = page.locator(
        `#${domElementIds.establishment.create.availabilityButton}`,
      );
      await expect(initialRadioButton.getByText("Oui")).not.toBeChecked();
      await expect(initialRadioButton.getByText("Non")).not.toBeChecked();
    });

    test(
      "in backoffice admin manage establishment",
      checkAvailabilityThoughBackOfficeAdmin(testEstablishments),
    );

    test(
      "in establishment dashboard",
      checkAvailabilityThoughEstablishmentDashboard(testEstablishments),
    );
  });

  test.describe("Admin deletes an establishment", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test("deletes an establishment", async ({ page }, { retry }) => {
      page.on("dialog", (dialog) => dialog.accept());
      await goToManageEtablishmentInBackOfficeAdmin(
        page,
        retry,
        testEstablishments,
      );
      await deleteEstablishmentInBackOfficeAdmin(page);
    });
  });
});
