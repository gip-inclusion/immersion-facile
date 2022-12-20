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
import { cypressDoIfElementExists, fillSelectRandomly } from "../utils";

const getIdFromConventionDTO = (field: DotNestedKeys<ConventionDto>) =>
  `#${cleanStringToHTMLAttribute(getConventionFieldName(field))}`;

describe("Convention Form", () => {
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
    cy.get(getIdFromConventionDTO("dateStart")).clear().type("2022-09-22");
    cy.get(getIdFromConventionDTO("dateEnd")).clear().type("2022-10-22");
    cy.get("#address-autocomplete")
      .clear()
      .type("71 Bd Saint-Michel 75005 Paris");
    cy.wait("@autocompleteAddressRequest");
    cy.get("#address-autocomplete").then(($element) => {
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
    cy.get("button[type=submit]").click();
    cy.wait("@conventionAddRequest")
      .its("response.statusCode")
      .should("eq", 200)
      .then(() => {
        cy.get(".fr-alert--error").should("not.exist");
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
    cy.get(getIdFromConventionDTO("dateStart")).clear().type("00/00/0000");
    cy.get(getIdFromConventionDTO("dateEnd")).clear().type("00/00/0000");
  });
});
