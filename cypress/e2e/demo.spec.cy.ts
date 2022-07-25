describe("Demo spec", () => {
  it("visit an external website", () => {
    cy.visit("https://example.cypress.io");
  });

  it("Visit the local client", () => {
    cy.visit('/')
  });
});
