import {
  frontRoutes,
  getConventionFieldName,
  cleanStringToHTMLAttribute,
  ConventionDto,
  DotNestedKeys,
  agenciesRoute,
  lookupStreetAddressRoute,
  conventionsRoute,
  featureFlagsRoute,
  appellationRoute,
} from "shared";
import { addDays, format } from "date-fns";

import { cypressDoIfElementExists, fillSelectRandomly } from "../utils";

const getIdFromConventionDTO = (field: DotNestedKeys<ConventionDto>) =>
  `#${cleanStringToHTMLAttribute(getConventionFieldName(field))}`;

describe("Convention Form (on dev http, prefilled forms false)", () => {
  const conventionFormUrl = `${frontRoutes.conventionImmersionRoute}`;
  const baseApiRoute = "/api/";
  it("can submit form with basic infos", () => {
    cy.intercept("GET", `${baseApiRoute}${featureFlagsRoute}`).as(
      "featureFlagsRequest",
    );
    cy.intercept("GET", `${baseApiRoute}${agenciesRoute}?**`).as(
      "agenciesRequest",
    );
    cy.intercept("GET", `${baseApiRoute}${lookupStreetAddressRoute}?**`).as(
      "autocompleteAddressRequest",
    );
    cy.intercept("GET", `${baseApiRoute}${appellationRoute}?**`).as(
      "autocompleteAppellationRequest",
    );
    cy.intercept("POST", `${baseApiRoute}${conventionsRoute}`).as(
      "conventionAddRequest",
    );

    cy.visit(conventionFormUrl);
    cy.wait("@featureFlagsRequest");

    cypressDoIfElementExists(".fr-btn--candidate", () => {
      cy.get(".fr-btn--candidate").click();
    });
    cy.get("#postalcode").clear().type("86000");

    cy.wait("@agenciesRequest");
    fillSelectRandomly({ element: "#agencyId" });
    cy.get(getIdFromConventionDTO("signatories.beneficiary.firstName"))
      .clear()
      .type("Archibald");
    cy.get(getIdFromConventionDTO("signatories.beneficiary.lastName"))
      .clear()
      .type("Haddock");
    cy.get(getIdFromConventionDTO("signatories.beneficiary.email"))
      .clear()
      .type("ahaddock@moulinsart.be");
    cy.get(getIdFromConventionDTO("signatories.beneficiary.phone"))
      .clear()
      .type("0585968574");
    cy.get(getIdFromConventionDTO("signatories.beneficiary.birthdate"))
      .clear()
      .type("1985-05-25");
    cy.get("#siret").clear().type("78886997200026");
    cypressDoIfElementExists(
      getIdFromConventionDTO("businessName") + ":not([disabled])",
      () => {
        cy.get(
          getIdFromConventionDTO("businessName") + ":not([disabled])",
        ).type("Entreprise de test");
      },
    );
    cy.get(getIdFromConventionDTO("establishmentTutor.firstName"))
      .clear()
      .type("Jean");
    cy.get(getIdFromConventionDTO("establishmentTutor.lastName"))
      .clear()
      .type("Bono");
    cy.get(getIdFromConventionDTO("establishmentTutor.job"))
      .clear()
      .type("Développeur web");
    cy.get(getIdFromConventionDTO("establishmentTutor.phone"))
      .clear()
      .type("0836656565");
    cy.get(getIdFromConventionDTO("establishmentTutor.email"))
      .clear()
      .type("establishmentTutor@example.com");
    cy.get(getIdFromConventionDTO("dateStart")).clear().type(getCurrentDate());
    cy.get(getIdFromConventionDTO("dateEnd")).clear().type(getTomorrowDate());
    cy.get("#im-address-autocomplete")
      .clear()
      .type("71 Bd Saint-Michel 75005 Paris");
    cy.wait("@autocompleteAddressRequest");
    cy.get("#im-address-autocomplete").then(($element) => {
      const listboxId = $element.attr("aria-controls");
      cy.get(`#${listboxId} .MuiAutocomplete-option`).then((options) => {
        options.eq(0).trigger("click");
      });
    });
    cy.get("#individualprotectiontrue").check({
      force: true,
    });
    cy.get("#sanitarypreventionfalse").check({
      force: true,
    });
    cy.get("[value='Confirmer un projet professionnel']").check({
      force: true, // DSFR, label:before is covering the input
    });
    cy.get("[id^=appellation-autocomplete]").type("Boulangerie");
    cy.wait("@autocompleteAppellationRequest");
    cy.get("[id^=appellation-autocomplete]").then(($element) => {
      const listboxId = $element.attr("aria-controls");
      cy.get(`#${listboxId} .MuiAutocomplete-option`).then((options) => {
        options.eq(0).trigger("click");
      });
    });
    cy.get(getIdFromConventionDTO("immersionActivities"))
      .clear()
      .type("Regarder le pain");
    cy.get("#im-submit-button")
      .click()
      .then(() => {
        cy.get(".fr-alert--error").should("not.exist");
        cy.wait("@conventionAddRequest")
          .its("response.statusCode")
          .should("eq", 200);
      });
  });
  // it("can't submit form if immersion duration exceeds 1 month", () => {});
  // it("can submit form with a complex schedule", () => {});
  // it("can edit multiple jobs dropdown", () => {});
  it("can edit input date with null / 0 value", () => {
    cy.visit(conventionFormUrl);
    cypressDoIfElementExists(".fr-btn--candidate", () => {
      cy.get(".fr-btn--candidate").click();
    });
    cy.get(getIdFromConventionDTO("dateStart"))
      .type("1998-02-03")
      .clear()
      .type("1998-03-21");
    cy.get(getIdFromConventionDTO("dateEnd"))
      .type("1998-02-03")
      .clear()
      .type("1998-05-22");
  });
});

const getCurrentDate = () => format(new Date(), "yyyy-MM-dd");
const getTomorrowDate = () => format(addDays(new Date(), 1), "yyyy-MM-dd");
