import { frontRoutes } from "shared";

describe("Simple navigation", () => {
  it("Go to admin and log in", () => {
    cy.visit("/admin");
    cy.get("#user").type(Cypress.env("ADMIN_USER"));
    cy.get("#password").type(Cypress.env("ADMIN_PASSWORD"));
    cy.contains("Se connecter").click();
  });

  it("Go to home page", () => {
    goToTab({ tabLabel: "Home", expectedRoute: "/" });
  });

  it("Goes to convention page", () => {
    goToTab({
      tabLabel: "Demande immersion",
      expectedRoute: `/${frontRoutes.conventionImmersionRoute}`,
    });
  });

  it("Goes to Backoffice page", () => {
    goToTab({
      tabLabel: "Backoffice",
      expectedRoute: `/${frontRoutes.admin}`,
    });
  });

  it("Goes to Establishment page", () => {
    goToTab({
      tabLabel: "Formulaire Entreprise",
      expectedRoute: `/${frontRoutes.establishment}`,
    });
  });

  it("Goes to landing establishment page", () => {
    goToTab({
      tabLabel: "Landing entreprise",
      expectedRoute: `/${frontRoutes.landingEstablishment}`,
    });
  });

  it("Goes to search page", () => {
    goToTab({
      tabLabel: "Recherche",
      expectedRoute: `/${frontRoutes.search}`,
    });
  });

  it("Goes to add agency page", () => {
    goToTab({
      tabLabel: "Ajouter agence",
      expectedRoute: `/${frontRoutes.addAgency}`,
    });
  });

  it("Back to home on header logo click", () => {
    cy.get(".fr-header__brand").click();
    expectLocationToBe("/");
  });

  it("Click on 'Je demande une convention'", () => {
    cy.contains("Je demande une convention").click();
    expectLocationToBe(`/${frontRoutes.conventionImmersionRoute}`);
  });

  const goToTab = ({
    tabLabel,
    expectedRoute,
  }: {
    tabLabel: string;
    expectedRoute: string;
  }) => {
    cy.get(".fr-nav__item a").contains(tabLabel).click();
    expectLocationToBe(expectedRoute);
  };

  const expectLocationToBe = (route: string) => {
    cy.location().should((location) => {
      expect(location.pathname).to.eq(route);
    });
  };
});
