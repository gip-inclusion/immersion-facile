import { faker } from "@faker-js/faker/locale/fr";
import { expect, test } from "@playwright/test";
import { addMonths } from "date-fns";
import { FormEstablishmentDto, domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import { phoneRegexp } from "../../utils/utils";
import { createNewEstablishment } from "./createNewEstablishment";
import {
  EstablishmentsRetries,
  fillEstablishmentFormFirstStep,
} from "./establishmentForm.utils";
import { goToManageEtablishmentBySiretInAdmin as goToManageEtablishmentInBackOfficeAdmin } from "./establishmentNavigation.utils";
import {
  checkAvailabilityThoughBackOfficeAdmin,
  checkAvailabilityThoughEstablishmentDashboard,
  checkEstablishmentInAdmin,
  deleteEstablishmentInBackOfficeAdmin,
} from "./manageEstablishment";
import {
  modifyEstablishmentMagicLink,
  updateEstablishmentBackOfficeAdmin,
} from "./modifyEstablishment";
import { searchEstablishment } from "./searchEstablishment";

test.describe.configure({ mode: "serial" });

test.describe("Establishment creation and modification workflow", () => {
  const establishmentRetries: EstablishmentsRetries = [
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
  const adminEmail = "admin+playwright@immersion-facile.beta.gouv.fr";
  const copyEmail =
    "recette+copy-updated-establishment@immersion-facile.beta.gouv.fr";

  const initialEstablishmentInformations: Partial<FormEstablishmentDto> = {
    businessContact: {
      job: faker.person.jobType(),
      phone: faker.helpers.fromRegExp(phoneRegexp),
      email: adminEmail,
      contactMethod: "PHONE",
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      copyEmails: [copyEmail],
    },
  };

  const updatedInformations: Partial<FormEstablishmentDto> = {
    businessNameCustomized: faker.company.name(),
    additionalInformation: faker.lorem.sentence(),
    maxContactsPerMonth: faker.number.int({ min: 1, max: 10 }),
    businessContact: {
      job: faker.person.jobType(),
      phone: faker.helpers.fromRegExp(phoneRegexp),
      email: adminEmail,
      contactMethod: "PHONE",
      firstName: "Prénom Admin",
      lastName: "Nom Admin",
      copyEmails: [copyEmail],
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
  };

  test(
    "creates a new establishment",
    createNewEstablishment(
      initialEstablishmentInformations,
      establishmentRetries,
    ),
  );

  test.describe("Establishment admin", () => {
    test.use({ storageState: testConfig.adminAuthFile });

    test(
      "modifies an existing establishment through magic link",
      modifyEstablishmentMagicLink(updatedInformations, establishmentRetries),
    );

    test(
      "check that establishment has been updated through admin",
      checkEstablishmentInAdmin(updatedInformations, establishmentRetries),
    );
  });

  test(
    "searches for non available establishment",
    searchEstablishment(establishmentRetries, 0),
  );

  test.describe("Admin makes the establishment available", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test(
      "make the establishment available",
      updateEstablishmentBackOfficeAdmin(establishmentRetries),
    );
  });

  test(
    "searches for available establishment",
    searchEstablishment(establishmentRetries, 1),
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
      "in admin manage establishment",
      checkAvailabilityThoughBackOfficeAdmin(establishmentRetries),
    );

    test(
      "in establishment dashboard",
      checkAvailabilityThoughEstablishmentDashboard(establishmentRetries),
    );
  });

  test.describe("Admin deletes an establishment", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test("deletes an establishment", async ({ page }, { retry }) => {
      page.on("dialog", (dialog) => dialog.accept());
      await goToManageEtablishmentInBackOfficeAdmin(
        page,
        retry,
        establishmentRetries,
      );
      await deleteEstablishmentInBackOfficeAdmin(page);
    });
  });
});
