import { frontRoutes } from "../../shared";
const selectedRoutes = [
  "/",
  frontRoutes.search,
  `${frontRoutes.conventionImmersionRoute}?jwt=bypass-share-screen`,
  frontRoutes.addAgency,
  frontRoutes.establishment,
];
describe("Validate a11y with axe on main pages", () => {
  const testState = {
    currentUrl: selectedRoutes[0],
  };
  beforeEach(() => {
    cy.visit(testState.currentUrl);
    cy.injectAxe();
  });
  selectedRoutes.forEach((url) => {
    it(`Axe should pass on ${url}`, () => {
      testState.currentUrl = url;
      cy.checkA11y();
    });
  });
});
