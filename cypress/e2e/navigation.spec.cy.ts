import { frontRoutes } from "shared";

describe("Simple navigation", () => {
  // TODO: do separate test for admin navigation
  it("Go to admin and log in", () => {
    cy.visit("/admin");
    cy.get("#user").type(Cypress.env("ADMIN_USER"));
    cy.get("#password").type(Cypress.env("ADMIN_PASSWORD"));
    cy.contains("Se connecter").click();
  });

  it("Go to home page", () => {
    goToTab({ tabLabel: "Accueil", expectedRoute: "/" });
  });

  it("Goes to home candidates", () => {
    goToTab({
      tabLabel: "Accueil candidat",
      expectedRoute: `/${frontRoutes.homeCandidates}`,
    });
  });
  it("Goes to home establishment", () => {
    goToTab({
      tabLabel: "Accueil entreprise",
      expectedRoute: `/${frontRoutes.homeEstablishments}`,
    });
  });
  it("Goes to home agency", () => {
    goToTab({
      tabLabel: "Accueil prescripteurs",
      expectedRoute: `/${frontRoutes.homeAgencies}`,
    });
  });

  it("Goes to convention page", () => {
    goToTab({
      tabLabel: "Remplir la demande de convention",
      expectedRoute: `/${frontRoutes.conventionImmersionRoute}`,
    });
  });

  it("Goes to Establishment form", () => {
    goToTab({
      tabLabel: "Référencer mon entreprise",
      expectedRoute: `/${frontRoutes.establishment}`,
    });
  });

  it("Goes to search page", () => {
    goToTab({
      tabLabel: "Trouver une entreprise accueillante",
      expectedRoute: `/${frontRoutes.search}`,
    });
  });

  it("Goes to add agency page", () => {
    goToTab({
      tabLabel: "Référencer mon organisme",
      expectedRoute: `/${frontRoutes.addAgency}`,
    });
  });

  it("Back to home on header logo click", () => {
    cy.get(".fr-header__brand").click();
    expectLocationToBe("/");
  });

  const goToTab = ({
    tabLabel,
    expectedRoute,
  }: {
    tabLabel: string;
    expectedRoute: string;
  }) => {
    const target = cy.get(".fr-nav__item a").contains(tabLabel);
    target.then(($element) => {
      if (!$element.is(":visible")) {
        $element
          .parent()
          .parents(".fr-nav__item")
          .find(".fr-nav__btn")
          .trigger("click");
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
