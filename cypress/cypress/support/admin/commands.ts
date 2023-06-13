import { domElementIds } from "../../../../shared/src";

const { baseApiRoute } = Cypress.env("config");

Cypress.Commands.add("connectToAdmin", () => {
  cy.intercept("POST", `${baseApiRoute}admin/login`).as("loginRequest");
  cy.visit("/admin");
  cy.get(`#${domElementIds.admin.adminPrivateRoute.formLoginUserInput}`).type(
    Cypress.env("ADMIN_USER"),
  );
  cy.get(
    `#${domElementIds.admin.adminPrivateRoute.formLoginPasswordInput}`,
  ).type(Cypress.env("ADMIN_PASSWORD"));
  cy.get(
    `#${domElementIds.admin.adminPrivateRoute.formLoginSubmitButton}`,
  ).click();
  cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);
});

Cypress.Commands.add("openEmailInAdmin", ({ emailType, elementIndex = 0 }) => {
  cy.get(".fr-tabs__tab").contains("Notifications").click();
  const accordionButton = cy
    .get(`.fr-accordion__btn:contains(${emailType})`)
    .eq(elementIndex);
  accordionButton.click();
  return accordionButton.parents(".fr-accordion");
});

Cypress.Commands.add("getMagicLinkInEmailWrapper", ($emailWrapper) => {
  const $link = $emailWrapper
    .find("span:contains('magicLink')")
    .next()
    .find("a");
  return cy.wrap($link);
});
