import {
  frontRoutes,
  getConventionFieldName,
  cleanStringToHTMLAttribute,
  ConventionDto,
  DotNestedKeys,
  agenciesRoute,
  conventionsRoute,
  featureFlagsRoute,
  appellationRoute,
  addressTargets,
  domElementIds,
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
    cy.intercept(
      "GET",
      `${baseApiRoute}${addressTargets.lookupStreetAddress.url}?**`,
    ).as("autocompleteAddressRequest");
    cy.intercept("GET", `${baseApiRoute}${appellationRoute}?**`).as(
      "autocompleteAppellationRequest",
    );
    cy.intercept("POST", `${baseApiRoute}${conventionsRoute}`).as(
      "conventionAddRequest",
    );

    cy.visit(conventionFormUrl);
    cy.wait("@featureFlagsRequest");

    cy.get(`#${domElementIds.conventionImmersionRoute.showFormButton}`).click();
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.agencyDepartment}`,
    )
      .select("86")
      .should("have.value", "86");

    cy.wait("@agenciesRequest");

    fillSelectRandomly({
      element: `#${domElementIds.conventionImmersionRoute.conventionSection.agencyId}`,
    });
    cy.get(
      `#${domElementIds.conventionImmersionRoute.beneficiarySection.firstName}`,
    )
      .clear()
      .type("Archibald");
    cy.get(
      `#${domElementIds.conventionImmersionRoute.beneficiarySection.lastName}`,
    )
      .clear()
      .type("Haddock");
    cy.get(
      `#${domElementIds.conventionImmersionRoute.beneficiarySection.email}`,
    )
      .clear()
      .type("ahaddock@moulinsart.be");
    cy.get(
      `#${domElementIds.conventionImmersionRoute.beneficiarySection.phone}`,
    )
      .clear()
      .type("0585968574");
    cy.get(
      `#${domElementIds.conventionImmersionRoute.beneficiarySection.birthdate}`,
    )
      .clear()
      .type("1985-05-25");
    cy.get(`#${domElementIds.conventionImmersionRoute.conventionSection.siret}`)
      .clear()
      .type("78886997200026");
    cypressDoIfElementExists(
      `#${domElementIds.conventionImmersionRoute.conventionSection.siret}:not([disabled])`,
      () => {
        cy.get(
          `#${domElementIds.conventionImmersionRoute.conventionSection.siret}:not([disabled])`,
        ).type("Entreprise de test");
      },
    );
    cy.get(
      `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.firstName}`,
    )
      .clear()
      .type("Jean");
    cy.get(
      `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.lastName}`,
    )
      .clear()
      .type("Bono");
    cy.get(
      `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.job}`,
    )
      .clear()
      .type("Développeur web");
    cy.get(
      `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.phone}`,
    )
      .clear()
      .type("0836656565");
    cy.get(
      `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.email}`,
    )
      .clear()
      .type("establishmentTutor@example.com");
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.dateStart}`,
    )
      .clear()
      .type(getCurrentDate());
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.dateEnd}`,
    )
      .clear()
      .type(getTomorrowDate());
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.immersionAddress}`,
    )
      .clear()
      .type("71 Bd Saint-Michel 75005 Paris");
    cy.wait("@autocompleteAddressRequest");
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.immersionAddress}`,
    ).then(($element) => {
      const listboxId = $element.attr("aria-controls");
      cy.get(`#${listboxId} .MuiAutocomplete-option`).then((options) => {
        options.eq(0).trigger("click");
      });
    });
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.individualProtection} input:first-of-type`,
    ).check({
      force: true,
    });
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.sanitaryPrevention} input:first-of-type`,
    ).check({
      force: true,
    });
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.immersionObjective} input:first-of-type`,
    ).check({
      force: true, // DSFR, label:before is covering the input
    });
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.immersionAppellation}`,
    ).type("Boulangerie");
    cy.wait("@autocompleteAppellationRequest");
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.immersionAppellation}`,
    ).then(($element) => {
      const listboxId = $element.attr("aria-controls");
      cy.get(`#${listboxId} .MuiAutocomplete-option`).then((options) => {
        options.eq(0).trigger("click");
      });
    });
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.immersionActivities}`,
    )
      .clear()
      .type("Regarder le pain");
    cy.get(`#${domElementIds.conventionImmersionRoute.submitFormButton}`)
      .click()
      .then(() => {
        cy.get(".fr-alert--error").should("not.exist");
        cy.wait("@conventionAddRequest")
          .its("response.statusCode")
          .should("eq", 200);
      });
  });
  it.skip("can't submit form if immersion duration exceeds 1 month", () => {});
  it.skip("can submit form with a complex schedule", () => {});
  it.skip("can edit multiple jobs dropdown", () => {});
  it("can edit input date with null / 0 value", () => {
    cy.visit(conventionFormUrl);
    cy.get(domElementIds.conventionImmersionRoute.showFormButton).click();
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
