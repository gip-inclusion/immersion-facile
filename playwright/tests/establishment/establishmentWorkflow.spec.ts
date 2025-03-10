import { faker } from "@faker-js/faker/locale/fr";
import { test } from "@playwright/test";
import { addMonths } from "date-fns";
import { type FormEstablishmentDto, FormEstablishmentDtoBuilder } from "shared";
import { testConfig } from "../../custom.config";
import { phoneRegexp } from "../../utils/utils";
import { createEstablishmentForm } from "./createNewEstablishment";
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

test.describe.configure({ mode: "serial" });

test.describe("Establishment creation and modification workflow", () => {
  const initialEstablishmentInformations: FormEstablishmentDto =
    FormEstablishmentDtoBuilder.valid()
      .withSiret("13003013300016")
      .withContactMethod("PHONE")
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
          rawAddress: "127 Rue de Grenelle 75007 Paris",
        },
      ])
      .build();

  const updatedEstablishment: FormEstablishmentDto =
    new FormEstablishmentDtoBuilder(initialEstablishmentInformations)
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
      createEstablishmentForm(initialEstablishmentInformations),
    );

    test(
      "modifies an existing establishment through establishment dashboard",
      updateEstablishmentThroughEstablishmentDashboard(updatedEstablishment),
    );

    test(
      "in establishment dashboard",
      checkAvailabilityThoughEstablishmentDashboard(updatedEstablishment),
    );
  });

  test.describe("Check establishment as backoffice admin", () => {
    test.use({ storageState: testConfig.adminAuthFile });

    test(
      "check that establishment has been updated through backoffice admin",
      checkEstablishmentUpdatedThroughBackOfficeAdmin(updatedEstablishment),
    );
  });

  test(
    "searches for non available establishment",
    searchEstablishmentAndExpectResultToHaveLength(updatedEstablishment, 0),
  );

  test.describe("Admin makes the establishment available", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test(
      "make the establishment available",
      updateEstablishmentAvailabilityThroughBackOfficeAdmin(
        updatedEstablishment,
      ),
    );
  });

  test(
    "searches for available establishment",
    searchEstablishmentAndExpectResultToHaveLength(updatedEstablishment, 1),
  );

  test.describe("Check displayed availability", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test(
      "in backoffice admin manage establishment",
      checkAvailabilityThoughBackOfficeAdmin(updatedEstablishment),
    );
  });

  test.describe("Admin deletes an establishment", () => {
    test.use({ storageState: testConfig.adminAuthFile });
    test("deletes an establishment", async ({ page }) => {
      page.on("dialog", (dialog) => dialog.accept());
      await goToManageEtablishmentInBackOfficeAdmin(
        page,
        updatedEstablishment.siret,
      );
      await deleteEstablishmentInBackOfficeAdmin(page);
    });
  });
});
