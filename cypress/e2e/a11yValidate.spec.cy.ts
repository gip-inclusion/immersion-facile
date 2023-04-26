import { domElementIds, frontRoutes } from "../../shared";
import { disableNewUrlLog } from "../utils";
const selectedRoutes = [
  "/",
  frontRoutes.search,
  frontRoutes.conventionImmersionRoute,
  frontRoutes.addAgency,
  frontRoutes.establishment,
];

const axeConf = {
  includedImpacts: ["serious", "critical"],
};

describe("Validate a11y with axe on main pages", () => {
  it(`Axe should pass on home`, () => {
    cy.visit("/");
    runCheckA11y();
  });
  it(`Axe should pass on search`, () => {
    cy.visit(frontRoutes.search);
    runCheckA11y();
  });
  it(`Axe should pass on convention form`, () => {
    disableNewUrlLog();
    cy.visit(frontRoutes.conventionImmersionRoute);
    cy.get(`#${domElementIds.conventionImmersionRoute.showFormButton}`).click();
    runCheckA11y();
  });
  it(`Axe should pass on add agency form`, () => {
    cy.visit(frontRoutes.addAgency);
    runCheckA11y();
  });
  it(`Axe should pass on form establishment`, () => {
    cy.visit(frontRoutes.establishment);
    runCheckA11y();
  });
});

const runCheckA11y = () => {
  cy.injectAxe();
  cy.checkA11y(null, axeConf);
};
