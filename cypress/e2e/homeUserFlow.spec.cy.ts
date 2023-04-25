import { domElementIds, frontRoutes } from "shared";

describe("Home user flow", () => {
  const userTypes = ["candidate", "establishment", "agency"];

  it("Should change theme based on user type", () => {
    cy.wrap(userTypes).each((type) => {
      cy.visit("/");
      cy.get(
        `#${domElementIds.home.heroHeader[type as unknown as string]}`,
      ).click();
      cy.get(".im-hero-header").should("have.class", `im-hero-header--${type}`);
    });
  });
  it("User flow: Candidate -> search", () => {
    cy.visit("/");
    cy.get(`#${domElementIds.home.heroHeader.candidate}`).click();
    cy.get(`#${domElementIds.homeCandidates.heroHeader.search}`).click();
    expectLocationToBe(`/${frontRoutes.search}`);
  });
  it("User flow: Candidate -> convention form", () => {
    cy.visit("/");
    cy.get(`#${domElementIds.home.heroHeader.candidate}`).click();
    cy.get(
      `#${domElementIds.homeCandidates.heroHeader.formConvention}`,
    ).click();
    cy.get(`#${domElementIds.conventionImmersionRoute.showFormButton}`).click();
    expectLocationToBe(`/${frontRoutes.conventionImmersionRoute}`);
  });
  it("User flow: Establishment -> convention form", () => {
    cy.visit("/");
    cy.get(`#${domElementIds.home.heroHeader.establishment}`).click();
    cy.get(
      `#${domElementIds.homeEstablishments.heroHeader.formConvention}`,
    ).click();
    expectLocationToBe(`/${frontRoutes.conventionImmersionRoute}`);
  });
  it("User flow: Agency -> register form", () => {
    cy.visit("/");
    cy.get(`#${domElementIds.home.heroHeader.agency}`).click();
    cy.get(`#${domElementIds.homeAgencies.heroHeader.addAgencyForm}`).click();
    expectLocationToBe(`/${frontRoutes.addAgency}`);
  });
  it.skip("User flow: Agency -> edit form", () => {
    cy.visit("/");
    cy.get(`#${domElementIds.home.heroHeader.agency}`).click();
    cy.get(`#${domElementIds.homeAgencies.heroHeader.addAgencyForm}`).click();
    expectLocationToBe(`/${frontRoutes.addAgency}`);
  });
  it("User flow: Agency -> convention form", () => {
    cy.visit("/");
    cy.get(`#${domElementIds.home.heroHeader.agency}`).click();
    cy.get(`#${domElementIds.homeAgencies.heroHeader.formConvention}`).click();
    expectLocationToBe(`/${frontRoutes.conventionImmersionRoute}`);
  });
  const expectLocationToBe = (route: string) => {
    cy.location().should((location) => {
      expect(location.pathname).to.eq(route);
    });
  };
});
