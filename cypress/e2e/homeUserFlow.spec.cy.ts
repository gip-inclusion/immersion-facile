import { frontRoutes } from "shared";

describe("Home user flow", () => {
  const userTypes = ["candidate", "establishment", "agency"];

  it("Should change theme based on user type", () => {
    cy.wrap(userTypes).each((type) => {
      cy.visit("/");
      cy.get(`.im-hero-header__nav-card--${type}`).click();
      cy.get(".im-hero-header").should("have.class", `im-hero-header--${type}`);
    });
  });
  it("User flow: Candidate -> search", () => {
    cy.visit("/");
    cy.get(".im-hero-header__nav-card--candidate").click();
    cy.get(".im-hero-header__nav-card--candidate").eq(0).click();
    expectLocationToBe(`/${frontRoutes.search}`);
  });
  it("User flow: Candidate -> convention form", () => {
    cy.visit("/");
    cy.get(".im-hero-header__nav-card--candidate").click();
    cy.get(".im-hero-header__nav-card--candidate").eq(1).click();
    cy.get(".fr-modal__content .fr-btn").click();
    expectLocationToBe(`/${frontRoutes.conventionImmersionRoute}`);
  });
  it("User flow: Establishment -> convention form", () => {
    cy.visit("/");
    cy.get(".im-hero-header__nav-card--establishment").click();
    cy.get(".im-hero-header__nav-card--establishment").eq(2).click();
    expectLocationToBe(`/${frontRoutes.conventionImmersionRoute}`);
  });
  it("User flow: Agency -> register form", () => {
    cy.visit("/");
    cy.get(".im-hero-header__nav-card--agency").click();
    cy.get(".im-hero-header__nav-card--agency").eq(0).click();
    expectLocationToBe(`/${frontRoutes.addAgency}`);
  });
  it.skip("User flow: Agency -> edit form", () => {
    cy.visit("/");
    cy.get(".im-hero-header__nav-card--agency").click();
    cy.get(".im-hero-header__nav-card--agency").eq(1).click();
    expectLocationToBe(`/${frontRoutes.addAgency}`);
  });
  it("User flow: Agency -> convention form", () => {
    cy.visit("/");
    cy.get(".im-hero-header__nav-card--agency").click();
    cy.get(".im-hero-header__nav-card--agency").eq(1).click();
    expectLocationToBe(`/${frontRoutes.conventionImmersionRoute}`);
  });
  const expectLocationToBe = (route: string) => {
    cy.location().should((location) => {
      expect(location.pathname).to.eq(route);
    });
  };
});
