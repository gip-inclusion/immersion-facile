import { frontRoutes } from "../../shared";
const selectedRoutes = [
  "/",
  frontRoutes.addAgency,
  `${frontRoutes.conventionImmersionRoute}?jwt=bypass-share-screen`,
  frontRoutes.search,
  frontRoutes.landingEstablishment,
  frontRoutes.establishment,
];
describe("Validate HTML on main pages", () => {
  selectedRoutes.forEach((url) => {
    it(`HTML should be valid on ${url}`, () => {
      cy.visit(url);
      cy.htmlvalidate();
    });
  });
});
