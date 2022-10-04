import { frontRoutes } from "shared";
const selectedRoutes = [
  "/",
  frontRoutes.addAgency,
  frontRoutes.search,
  frontRoutes.landingEstablishment,
];
describe("Validate HTML on main pages", () => {
  selectedRoutes.forEach((url) => {
    it(`HTML should be valid on ${url}`, () => {
      cy.visit(url);
      cy.htmlvalidate();
    });
  });
});
