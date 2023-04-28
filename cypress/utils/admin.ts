import { domElementIds } from "../../shared/src";

export const connectToAdmin = () => {
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
};
