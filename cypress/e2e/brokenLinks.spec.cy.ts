describe("Check for broken links", () => {
  it(`Check for links in error`, () => {
    cy.visit("/");
    const links = cy.get(".fr-footer a, .fr-header a");
    links.each(($link) => {
      const href = $link.attr("href");
      cy.request($link.attr("href")).should((response) => {
        expect(response.status).to.be.greaterThan(199).and.lessThan(400);
      });
    });
  });
});
