import { frontRoutes } from "../../shared";
import { cypressDoIfElementExists } from "../utils/conditional";

describe("Convention Form", () => {
  const conventionFormUrl = `${frontRoutes.conventionImmersionRoute}`;
  it("can submit form with basic infos", () => {
    cy.intercept("/**").as("xhr-requests");
    cy.visit(conventionFormUrl);
    cypressDoIfElementExists(".fr-btn--candidate", () => {
      cy.get(".fr-btn--candidate").click();
    });
    cy.get("#postalcode").clear().type("86000");
    cy.wait(200);
    fillSelectRandomly({ element: "#agencyId" });
    cy.get("#signatories-beneficiary-firstname").clear().type("Archibald");
    cy.get("#signatories-beneficiary-lastname").clear().type("Haddock");
    cy.get("#signatories-beneficiary-email")
      .clear()
      .type("ahaddock@moulinsart.be");
    cy.get("#siret").clear().type("12345678901238");
    cy.get("body").then(($body) => {
      if ($body.find("#businessname:not([disabled])").length) {
        cy.get("#businessname:not([disabled])").type("Entreprise de test");
      }
    });
    cy.get("#signatories-mentor-firstname").clear().type("Jean");
    cy.get("#signatories-mentor-lastname").clear().type("Bono");
    cy.get("#signatories-mentor-job").clear().type("Développeur web");
    cy.get("#signatories-mentor-phone").clear().type("0836656565");
    cy.get("#signatories-mentor-email").clear().type("mentor@example.com");
    cy.get("[name='dateStart']").clear().type("2022-09-22");
    cy.get("[name='dateEnd']").clear().type("2022-10-22");
    cy.get("#address-autocomplete")
      .clear()
      .type("71 Bd Saint-Michel 75005 Paris")
      .then(($element) => {
        const listboxId = $element.attr("aria-controls");
        cy.get(`#${listboxId} .MuiAutocomplete-option`).eq(1).trigger("click");
      });

    cy.get("[value='Confirmer un projet professionnel']").check({
      force: true, // DSFR, label:before is covering the input
    });
    cy.get("[id^=appellation-autocomplete]").type("Boulangerie").blur();
    cy.get("#immersionactivities").clear().type("Regarder le pain");
    cy.get("button[type=submit]").click();
    cy.wait(1000)
      .wait("@xhr-requests")
      .its("response.statusCode")
      .should("eq", 200)
      .then(() => {
        cy.get(".fr-alert--error").should("not.exist");
      });
  });
  // it("can't submit form if immersion duration exceeds 1 month", () => {});
  // it("can submit form with a complex schedule", () => {});
  // it("can edit multiple jobs dropdown", () => {});
  // it("can edit input date with null / 0 value", () => {});
  const randomNumber = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  const fillSelectRandomly = ({ element }: { element: string }) => {
    const selector = element;
    const selectorOptions = `${selector} > option`;
    cy.get(selectorOptions).then(($options) => {
      cy.get(selectorOptions)
        .eq(randomNumber(1, $options.length - 1))
        .then(($select) => {
          const label = $select.text();
          cy.get(selector).select(label);
        });
    });
  };
});
