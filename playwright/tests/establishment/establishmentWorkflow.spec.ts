import { faker } from "@faker-js/faker/locale/fr";
import { test } from "@playwright/test";
import { addMonths } from "date-fns";
import { FormEstablishmentDtoBuilder } from "shared";
import { testConfig } from "../../custom.config";
import { phoneRegexp } from "../../utils/utils";
import { createEstablishmentForm } from "./createNewEstablishment";
import type { MakeFormEstablishmentFromRetryNumber } from "./establishmentForm.utils";
import { goToManageEtablishmentBySiretInAdmin as goToManageEtablishmentInBackOfficeAdmin } from "./establishmentNavigation.utils";
import {
  checkAvailabilityThoughBackOfficeAdmin,
  checkAvailabilityThoughEstablishmentDashboard,
  checkEstablishmentUpdatedThroughBackOfficeAdmin,
  deleteEstablishmentInBackOfficeAdmin,
} from "./manageEstablishment";
import {
  updateEstablishmentAvailabilityThroughBackOfficeAdmin,
  updateEstablishmentThroughEstablishmentDashboard,
} from "./modifyEstablishment";
import { searchEstablishmentAndExpectResultToHaveLength } from "./searchEstablishment";

test.skip("Establishment creation and modification workflow", () => {
  test.describe.configure({ mode: "serial" });
  const testEstablishments = [
    {
      siret: "13003013300016",
      businessName: "Plateforme de l'inclusion",
      expectedAddress: "127 Rue de Grenelle 75007 Paris",
    },
    {
      siret: "21590350100017",
      businessName: "COMMUNE DE LILLE",
      expectedAddress: "Place Augustin Laurent 59000 Lille",
    },
    {
      siret: "21310555400017",
      businessName: "COMMUNE DE TOULOUSE",
      expectedAddress: "1 Place du Capitole 31000 Toulouse",
    },
  ];

  const makeInitialEstablishmentInformations: MakeFormEstablishmentFromRetryNumber =
    (retryIndex) => {
      const { siret, businessName, expectedAddress } =
        testEstablishments[retryIndex];
      return FormEstablishmentDtoBuilder.valid()
        .withSiret(siret)
        .withContactMethod("PHONE")
        .withBusinessName(businessName)
        .withUserRights([
          {
            role: "establishment-admin",
            email: testConfig.proConnect.username,
            job: faker.person.jobType(),
            phone: faker.helpers.fromRegExp(phoneRegexp),
          },
        ])
        .withBusinessAddresses([
          {
            id: "",
            rawAddress: expectedAddress,
          },
        ])
        .build();
    };

  const makeUpdatedEstablishment: MakeFormEstablishmentFromRetryNumber = (
    retryIndex,
  ) =>
    new FormEstablishmentDtoBuilder(
      makeInitialEstablishmentInformations(retryIndex),
    )
      .withBusinessNameCustomized(faker.company.name())
      .withAdditionalInformation(faker.lorem.sentence())
      .withMaxContactsPerMonth(faker.number.int({ min: 5, max: 7 }))
      .withUserRights([
        {
          role: "establishment-admin",
          email: testConfig.proConnect.username,
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

  test.describe("Create & update establishment as establishment admin", () => {
    test.use({ storageState: testConfig.establishmentAuthFile });
    test(
      "creates a new establishment",
      createEstablishmentForm(makeInitialEstablishmentInformations),
    );

    test(
      "modifies an existing establishment through establishment dashboard",
      updateEstablishmentThroughEstablishmentDashboard(
        makeUpdatedEstablishment,
      ),
    );

    test(
      "in establishment dashboard",
      checkAvailabilityThoughEstablishmentDashboard(makeUpdatedEstablishment),
    );
  });

  test.describe("Check establishment as backoffice admin", () => {
    test.use({ storageState: testConfig.adminAuthFile });

    test(
      "check that establishment has been updated through backoffice admin",
      checkEstablishmentUpdatedThroughBackOfficeAdmin(makeUpdatedEstablishment),
    );
  });

  test(
    "searches for non available establishment",
    searchEstablishmentAndExpectResultToHaveLength(makeUpdatedEstablishment, 0),
  );

  test.describe("Admin makes the establishment available", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test(
      "make the establishment available",
      updateEstablishmentAvailabilityThroughBackOfficeAdmin(
        makeUpdatedEstablishment,
      ),
    );
  });

  test(
    "searches for available establishment",
    searchEstablishmentAndExpectResultToHaveLength(makeUpdatedEstablishment, 1),
  );

  test.describe("Check displayed availability", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test(
      "in backoffice admin manage establishment",
      checkAvailabilityThoughBackOfficeAdmin(makeUpdatedEstablishment),
    );
  });

  test.describe("Admin deletes an establishment", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test("deletes an establishment", async ({ page }, { retry }) => {
      const updatedEstablishment = makeUpdatedEstablishment(retry);
      page.on("dialog", (dialog) => dialog.accept());
      await goToManageEtablishmentInBackOfficeAdmin(
        page,
        updatedEstablishment.siret,
      );
      await deleteEstablishmentInBackOfficeAdmin(page);
    });
  });
});
