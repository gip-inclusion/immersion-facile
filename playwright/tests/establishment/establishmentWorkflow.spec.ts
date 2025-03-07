import { faker } from "@faker-js/faker/locale/fr";
import { expect, test } from "@playwright/test";
import { addMonths } from "date-fns";
import {
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  domElementIds,
} from "shared";
import { testConfig } from "../../custom.config";
import { phoneRegexp } from "../../utils/utils";
import {
  createEstablishmentForm,
  goToCreateEstablishmentForm,
  step0,
} from "./createNewEstablishment";
import { TestEstablishments } from "./establishmentForm.utils";
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

  const initialEstablishmentInformations: FormEstablishmentDto =
    FormEstablishmentDtoBuilder.valid()
      .withSiret("12345678901234") // A VERIFIER
      .withContactMethod("PHONE")
      .withEstablishmentFormUserRights([
        {
          role: "establishment-admin", // A VERIFIER
          email: "toto.email@mail.com", // A VERIFIER
          job: faker.person.jobType(),
          phone: faker.helpers.fromRegExp(phoneRegexp),
        },
      ])
      .build();

  const updatedInformations: Partial<FormEstablishmentDto> =
    new FormEstablishmentDtoBuilder(initialEstablishmentInformations)
      .withBusinessNameCustomized(faker.company.name())
      .withAdditionalInformation(faker.lorem.sentence())
      .withMaxContactsPerMonth(faker.number.int({ min: 5, max: 7 }))
      .withEstablishmentFormUserRights([
        {
          role: "establishment-admin",
          email: "toto.email@mail.com", // A VERIFIER
          job: faker.person.jobType(),
          phone: faker.helpers.fromRegExp(phoneRegexp),
        },
        {
          role: "establishment-contact",
          email:
            "recette+copy-updated-establishment2@immersion-facile.beta.gouv.fr",
        },
      ])
      .withContactMethod("PHONE")
      .withSearchableBy({
        students: false,
        jobSeekers: true,
      })
      .withNextAvailabilityDate(addMonths(new Date(), 1))
      .withBusinessAddresses([
        {
          id: "fake-id",
          rawAddress: "6 rue de la chaîne 86000 Poitiers",
        },
      ])
      .withWebsite(`https://${faker.internet.domainName()}`)
      .withFitForDisabledWorkers(true)
      .withIsEngagedEnterprise(true)
      .build();

  test(
    "creates a new establishment",
    createEstablishmentForm(initialEstablishmentInformations),
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

    test("in create establishment form - availability button is not checked by default", async ({
      page,
    }) => {
      await goToCreateEstablishmentForm(page);
      await step0(page);
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
