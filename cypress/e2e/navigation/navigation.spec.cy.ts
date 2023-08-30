import { domElementIds, frontRoutes } from "shared";
import { disableUrlLogging } from "../../cypress/utils/log";

describe("Simple navigation", () => {
  // TODO: do separate test for admin navigation
  it("Go to admin and log in", () => {
    cy.connectToAdmin();
    it("Go to home page", () => {
      goToTab({
        selector: `#${domElementIds.header.navLinks.home}`,
        expectedRoute: "/",
      });
    });
  });

  it("Goes to home candidates", () => {
    cy.visit("/");
    goToTab({
      selector: `#${domElementIds.header.navLinks.candidate.home}`,
      expectedRoute: `/${frontRoutes.homeCandidates}`,
    });
  });
  it("Goes to home establishment", () => {
    cy.visit("/");
    goToTab({
      selector: `#${domElementIds.header.navLinks.establishment.home}`,
      expectedRoute: `/${frontRoutes.homeEstablishments}`,
    });
  });
  it("Goes to home agency", () => {
    cy.visit("/");
    goToTab({
      selector: `#${domElementIds.header.navLinks.agency.home}`,
      expectedRoute: `/${frontRoutes.homeAgencies}`,
    });
  });

  it("Goes to convention page", () => {
    disableUrlLogging();
    cy.visit("/");
    goToTab({
      selector: `#${domElementIds.header.navLinks.candidate.formConvention}`,
      expectedRoute: `/${frontRoutes.conventionImmersionRoute}`,
    });
  });

  it("Goes to Establishment form", () => {
    cy.visit("/");
    goToTab({
      selector: `#${domElementIds.header.navLinks.establishment.addEstablishmentForm}`,
      expectedRoute: `/${frontRoutes.establishment}`,
    });
  });

  it("Goes to search page", () => {
    cy.visit("/");
    goToTab({
      selector: `#${domElementIds.header.navLinks.candidate.search}`,
      expectedRoute: `/${frontRoutes.search}`,
    });
  });

  it("Goes to add agency page", () => {
    cy.visit("/");
    goToTab({
      selector: `#${domElementIds.header.navLinks.agency.addAgencyForm}`,
      expectedRoute: `/${frontRoutes.addAgency}`,
    });
  });

  it("Back to home on header logo click", () => {
    cy.visit("/");
    cy.get(".fr-header__brand").click();
    expectLocationToBe("/");
  });

  const goToTab = ({
    selector,
    expectedRoute,
  }: {
    selector: string;
    expectedRoute: string;
  }) => {
    const target = cy.get(selector);
    target.then(($element) => {
      if (!$element.is(":visible")) {
        $element.parents(".fr-nav__item").find(".fr-nav__btn").trigger("click");
      }
      target.click();
      expectLocationToBe(expectedRoute);
    });
  };

  const expectLocationToBe = (route: string) => {
    cy.location().should((location) => {
      expect(location.pathname).to.eq(route);
    });
  };
});
