import { addBusinessDays, format } from "date-fns";
import {
  frontRoutes,
  agenciesRoute,
  conventionsRoute,
  featureFlagsRoute,
  appellationRoute,
  addressTargets,
  domElementIds,
} from "shared";
import { cypressDoIfElementExists } from "./conditional";
import { fillSelectRandomly } from "./input";

const conventionFormUrl = `${frontRoutes.conventionImmersionRoute}`;
const baseApiRoute = "/api/";

export function basicFormConvention() {
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
  cy.get(`#${domElementIds.conventionImmersionRoute.beneficiarySection.email}`)
    .clear()
    .type("ahaddock@moulinsart.be");
  cy.get(`#${domElementIds.conventionImmersionRoute.beneficiarySection.phone}`)
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
  cy.get(`#${domElementIds.conventionImmersionRoute.conventionSection.dateEnd}`)
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
}

const getCurrentDate = () => format(new Date(), "yyyy-MM-dd");
const getTomorrowDate = () =>
  format(addBusinessDays(new Date(), 1), "yyyy-MM-dd");
