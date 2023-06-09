import { domElementIds } from "../../../../shared/src";

Cypress.Commands.add("connectToAdmin", () => {
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
});

Cypress.Commands.add("openEmailInAdmin", ({ emailType }) => {
  cy.connectToAdmin();
  cy.get(".fr-tabs__tab").contains("Emails").click();
  cy.get(`.fr-accordion__btn:contains(${emailType})`).click();
  return cy
    .get(`.fr-accordion__btn:contains(${emailType})`)
    .parents(".fr-accordion");
});

Cypress.Commands.add("getMagicLinkInEmailWrapper", ($emailWrapper) => {
  const $link = $emailWrapper
    .find("span:contains('magicLink')")
    .next()
    .find("a");
  return cy.wrap($link);
});
