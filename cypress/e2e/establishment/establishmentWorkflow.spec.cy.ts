import { faker } from "@faker-js/faker/locale/fr";
import {
  addressRoutes,
  appellationRoute,
  domElementIds,
  technicalRoutes,
  siretRoutes,
  establishmentRoutes,
  frontRoutes,
  immersionOffersRoute,
  makeUrlWithParams,
} from "shared";

const { baseApiRoute, defaultFieldOptions } = Cypress.env("config");
const providedSiret = "41433740200039";
const providedLocation = "Tain-l'Hermitage";

describe("Establishment creation and modification workflow", () => {
  it("creates a new establishment", () => {
    cy.intercept(
      "GET",
      `${baseApiRoute}${technicalRoutes.featureFlags.url}`,
    ).as("featureFlagsRequest");

    cy.intercept(
      "GET",
      `${baseApiRoute}${makeUrlWithParams(
        siretRoutes.getSiretInfoIfNotAlreadySaved,
        {
          siret: providedSiret,
        },
      )}`,
    ).as("siretIfNotAlreadySavedRequest");

    cy.intercept(
      "GET",
      `${baseApiRoute}${addressRoutes.lookupStreetAddress.url}?**`,
    ).as("addressAutocompleteRequest");

    cy.intercept("GET", `${baseApiRoute}${appellationRoute}?**`).as(
      "autocompleteAppellationRequest",
    );

    cy.intercept(
      "POST",
      `${baseApiRoute}${establishmentRoutes.addFormEstablishment.url}`,
    ).as("addFormEstablishmentRequest");

    // home
    cy.visit("/");
    cy.get(`#${domElementIds.home.heroHeader.establishment}`).click();

    cy.get(
      `#${domElementIds.homeEstablishments.heroHeader.addEstablishmentForm}`,
    ).click();

    cy.get(
      `#${domElementIds.homeEstablishments.siretModal.siretFetcherInput}`,
    ).type(providedSiret);

    cy.url().should("include", `siret=${providedSiret}`);

    cy.wait("@addressAutocompleteRequest")
      .its("response.statusCode")
      .should("be.oneOf", [200, 304]);

    cy.get(`#${domElementIds.establishment.siret}`).should(
      "have.value",
      providedSiret,
    );

    cy.get(`#${domElementIds.establishment.businessName}`).should(
      "not.have.value",
      "",
    );

    cy.get(
      `#${domElementIds.establishment.establishmentFormAddressAutocomplete}`,
    ).should("not.have.value", "");

    cy.get(`#${domElementIds.establishment.addAppellationButton}`)
      .click()
      .then(() => {
        cy.get(`#${domElementIds.establishment.appellations} .fr-input`).type(
          "boulang",
          defaultFieldOptions,
        );
      });

    cy.wait("@autocompleteAppellationRequest");

    cy.get(`#${domElementIds.establishment.appellations} .fr-input`).then(
      ($element) => {
        const listboxId = $element.attr("aria-controls");
        cy.get(`#${listboxId} .MuiAutocomplete-option`).then((options) => {
          options.eq(0).trigger("click");
        });
      },
    );
    cy.get(`#${domElementIds.establishment.businessContact.firstName}`).type(
      faker.name.firstName(),
      defaultFieldOptions,
    );
    cy.get(`#${domElementIds.establishment.businessContact.lastName}`).type(
      faker.name.lastName(),
      defaultFieldOptions,
    );
    cy.get(`#${domElementIds.establishment.businessContact.job}`).type(
      faker.name.jobTitle(),
      defaultFieldOptions,
    );
    cy.get(`#${domElementIds.establishment.businessContact.phone}`).type(
      faker.phone.number("06########"),
      defaultFieldOptions,
    );
    cy.get(`#${domElementIds.establishment.businessContact.email}`).type(
      faker.internet.email(),
      defaultFieldOptions,
    );
    cy.get(`#${domElementIds.establishment.submitButton}`).click();
    cy.wait("@addFormEstablishmentRequest")
      .its("response.statusCode")
      .should("eq", 200);
    cy.get(".fr-alert--success").should("exist");
  });

  it("modifies an existing establishment", () => {
    cy.intercept(
      "GET",
      `${baseApiRoute}${makeUrlWithParams(
        siretRoutes.getSiretInfoIfNotAlreadySaved,
        {
          siret: providedSiret,
        },
      )}`,
    ).as("siretIfNotAlreadySavedRequest");

    cy.intercept(
      "POST",
      `${baseApiRoute}${makeUrlWithParams(
        establishmentRoutes.requestEmailToUpdateFormRoute,
        {
          siret: providedSiret,
        },
      )}`,
    ).as("requestEmailToUpdateEstablishmentRequest");

    cy.intercept(
      "PUT",
      `${baseApiRoute}${establishmentRoutes.addFormEstablishment.url}`,
    ).as("addFormEstablishmentRequest");
    requestEstablishmentModification();
    cy.connectToAdmin();
    cy.openEmailInAdmin({
      emailType: "EDIT_FORM_ESTABLISHMENT_LINK",
      elementIndex: 0,
    })
      .first()
      .then(($emailWrapper) => {
        $emailWrapper
          .find("a:contains('Lien vers la page')")
          .each((_, element) => {
            cy.wrap(element).click();
            editAndSubmitModifiedEstablishment();
          });
      });
  });
  it("searches for an existing establishment", () => {
    cy.visit(frontRoutes.search);
    cy.intercept(
      "GET",
      `${baseApiRoute}${addressRoutes.lookupLocation.url}?query=**`,
    ).as("lookupLocationRequest");

    cy.intercept("GET", `${baseApiRoute}${immersionOffersRoute}?**`).as(
      "searchImmersionRequest",
    );

    cy.get(`#${domElementIds.search.placeAutocompleteInput}`).type(
      providedLocation,
    );
    cy.wait("@lookupLocationRequest")
      .its("response.statusCode")
      .should("be.oneOf", [200, 304]);
    cy.get(`#${domElementIds.search.placeAutocompleteInput}`).then(
      ($element) => {
        const listboxId = $element.attr("aria-controls");
        cy.get(`#${listboxId} .MuiAutocomplete-option`).then((options) => {
          options.eq(0).trigger("click");
        });
      },
    );
    cy.get(`#${domElementIds.search.searchSubmitButton}`).click();
    cy.wait("@searchImmersionRequest")
      .its("response.statusCode")
      .should("be.oneOf", [200, 304]);
    cy.get(
      `.im-search-result[data-establishment-siret=${providedSiret}]`,
    ).should("have.length", 1);
  });
  it("removes an existing establishment in admin", () => {
    cy.intercept(
      "GET",
      `${baseApiRoute}${makeUrlWithParams(
        establishmentRoutes.getFormEstablishment,
        {
          siret: providedSiret,
        },
      )}`,
    ).as("getFormEstablishmentRequest");
    cy.intercept(
      "GET",
      `${baseApiRoute}${makeUrlWithParams(
        establishmentRoutes.deleteEstablishment,
        {
          siret: providedSiret,
        },
      )}`,
    ).as("deleteFormEstablishmentRequest");
    cy.connectToAdmin();
    cy.goToAdminTab("Établissements");
    cy.get(`#${domElementIds.admin.manageEstablishment.siretInput}`).type(
      providedSiret,
    );
    cy.get(`#${domElementIds.admin.manageEstablishment.searchButton}`).click();
    cy.wait("@getFormEstablishmentRequest")
      .its("response.statusCode")
      .should("be.oneOf", [200, 304]);
    cy.get(
      `#${domElementIds.admin.manageEstablishment.submitDeleteButton}`,
    ).click();
    cy.wait("@deleteFormEstablishmentRequest")
      .its("response.statusCode")
      .should("be.oneOf", [200, 304]);
  });
});

const requestEstablishmentModification = () => {
  cy.visit("/");
  cy.get(`#${domElementIds.home.heroHeader.establishment}`).click();
  cy.get(
    `#${domElementIds.homeEstablishments.heroHeader.editEstablishmentForm}`,
  ).click();
  cy.get(
    `#${domElementIds.homeEstablishments.siretModal.siretFetcherInput}`,
  ).type(providedSiret);
  cy.wait("@siretIfNotAlreadySavedRequest")
    .its("response.statusCode")
    .should("eq", 409);
  cy.get(
    `#${domElementIds.homeEstablishments.siretModal.editEstablishmentButton}`,
  ).click();
  cy.wait("@requestEmailToUpdateEstablishmentRequest")
    .its("response.statusCode")
    .should("eq", 200);
};

const editAndSubmitModifiedEstablishment = () => {
  cy.get(`#${domElementIds.establishment.siret} input`)
    .should("be.disabled")
    .should("have.value", providedSiret);
  cy.get(`#${domElementIds.establishment.businessContact.job}`)
    .clear()
    .type(faker.name.jobTitle(), defaultFieldOptions);
  cy.get(`#${domElementIds.establishment.businessContact.phone}`)
    .clear()
    .type(faker.phone.number("06########"), defaultFieldOptions);
  cy.get(`#${domElementIds.establishment.businessContact.email}`)
    .clear()
    .type(faker.internet.email(), defaultFieldOptions);
  cy.get(`#${domElementIds.establishment.submitButton}`).click();
  cy.wait("@addFormEstablishmentRequest")
    .its("response.statusCode")
    .should("eq", 200);
  cy.get(".fr-alert--success").should("exist");
};
