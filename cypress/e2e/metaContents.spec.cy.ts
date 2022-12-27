import { routes } from "front/src/app/routes/routes";
import {
  metaContents,
  standardMetaContent,
} from "front/src/app/contents/meta/metaContents";
import { StandardPageSlugs } from "front/src/app/routes/route-params";

//TODO import jwt generator to test routes that required a JWT param

const routesNames: Array<{
  routeName: keyof typeof routes | StandardPageSlugs;
  params?: Partial<Record<"jwt" | "consumer" | "pagePath", string>>;
}> = [
  { routeName: "addAgency" },
  { routeName: "conventionForUkraine" },
  { routeName: "conventionImmersion" },
  { routeName: "conventionMiniStage" },
  // { routeName: "conventionStatusDashboard" },
  // { routeName: "conventionToSign" },
  // { routeName: "immersionAssessment" },
  { routeName: "formEstablishment" },
  { routeName: "home" },
  { routeName: "homeAgencies" },
  { routeName: "homeCandidates" },
  { routeName: "homeEstablishments" },
  { routeName: "search" },
  { routeName: "stats" },
  {
    routeName: "formEstablishmentForExternals",
    params: { consumer: "cci" },
  },
  {
    routeName: "standard",
    params: { pagePath: "cgu" },
  },
  {
    routeName: "standard",
    params: { pagePath: "mentions-legales" },
  },
  {
    routeName: "standard",
    params: { pagePath: "politique-de-confidentialite" },
  },
  {
    routeName: "standard",
    params: { pagePath: "declaration-accessibilite" },
  },
];
describe("Check Meta contents ", () => {
  routesNames.forEach((route) => {
    it(`Should render the correct title value according to the route called: ${route.routeName} `, () => {
      cy.visit(`${routes[`${route.routeName}`]({ ...route.params }).href}`);
      if (route.routeName === "standard") {
        cy.title().should(
          "eq",
          `${
            standardMetaContent[`${route.params.pagePath}`].title
          } - PMSMP: Immersion Facile`,
        );
        cy.get('head meta[name="description"]').should(
          "have.attr",
          "content",
          `${standardMetaContent[`${route.params.pagePath}`].description}`,
        );
      } else {
        cy.title().should(
          "eq",
          `${
            metaContents[`${route.routeName}`].title
          } - PMSMP: Immersion Facile`,
        );
        cy.get('head meta[name="description"]').should(
          "have.attr",
          "content",
          `${metaContents[`${route.routeName}`].description}`,
        );
      }
    });
  });
});
