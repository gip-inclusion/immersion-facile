import { faker } from "@faker-js/faker/locale/fr";
import {
  addressTargets,
  appellationRoute,
  domElementIds,
  featureFlagsRoute,
  siretTargets,
  establishmentTargets,
} from "shared";

const baseApiRoute = "/api/";

describe("Establishment creation and modification workflow", () => {
  it("creates a new establishment", () => {
    cy.intercept("GET", `${baseApiRoute}${featureFlagsRoute}`).as(
      "featureFlagsRequest",
    );

    cy.intercept(
      "GET",
      `${baseApiRoute}${siretTargets.getSiretInfoIfNotAlreadySaved.url.replace(
        "/:siret",
        "",
      )}`,
    ).as("siretIfNotAlreadySavedRequest");

    cy.intercept(
      "GET",
      `${baseApiRoute}${addressTargets.lookupStreetAddress.url}?**`,
    ).as("addressAutocompleteRequest");

    cy.intercept("GET", `${baseApiRoute}${appellationRoute}?**`).as(
      "autocompleteAppellationRequest",
    );

    cy.intercept(
      "POST",
      `${baseApiRoute}${establishmentTargets.addFormEstablishment.url}`,
    ).as("addFormEstablishmentRequest");

    // home
    cy.visit("/");
    cy.get(`#${domElementIds.home.heroHeader.establishment}`).click();

    cy.get(
      `#${domElementIds.homeEstablishments.heroHeader.addEstablishmentForm}`,
    ).click();

    const providedSiret = "41433740200039";

    cy.get(
      `#${domElementIds.homeEstablishments.siretModal.siretFetcherInput}`,
    ).type(providedSiret);

    cy.url().should("include", `/establishment?siret=${providedSiret}`);

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
    cy.get(`#${domElementIds.establishment.appellations} .fr-input`).type(
      "boulang",
      {
        force: true, // To avoid typing in disabled input (cf. https://github.com/cypress-io/cypress/issues/5827)
      },
    );

    cy.wait("@autocompleteAppellationRequest");

    cy.get(`#${domElementIds.establishment.appellations} .fr-input`).then(
      ($element) => {
        console.log($element);
        const listboxId = $element.attr("aria-controls");
        cy.get(`#${listboxId} .MuiAutocomplete-option`).then((options) => {
          options.eq(0).trigger("click");
        });
      },
    );
    cy.get(`#${domElementIds.establishment.businessContact.firstName}`).type(
      faker.name.firstName(),
      {
        force: true,
      },
    );
    cy.get(`#${domElementIds.establishment.businessContact.lastName}`).type(
      faker.name.lastName(),
      {
        force: true,
      },
    );
    cy.get(`#${domElementIds.establishment.businessContact.job}`).type(
      faker.name.jobTitle(),
      {
        force: true,
      },
    );
    cy.get(`#${domElementIds.establishment.businessContact.phone}`).type(
      faker.phone.number("06########"),
      {
        force: true,
      },
    );
    cy.get(`#${domElementIds.establishment.businessContact.email}`).type(
      faker.internet.email(),
      {
        force: true,
      },
    );
    cy.get(`#${domElementIds.establishment.submitButton}`).click();
    cy.wait("@addFormEstablishmentRequest")
      .its("response.statusCode")
      .should("eq", 200);
    cy.get(".fr-alert--success").should("exist");
  });
});

// on peut faire une recherche qui trouve l'établissement

// 2.
// on retourne sur la home
// on saisie le même siret
// on a un message et un bouton pour demander la modification
// on clique sur le bouton
// on va dans l'admin voir les mails
// on clique sur le lien
// on edite l'établissement
// on valide

// on peut faire une recherche qui trouve l'établissement
