import { frontRoutes, domElementIds } from "shared";
import { disableUrlLogging } from "../../cypress/utils/log";
const conventionFormUrl = `${frontRoutes.conventionImmersionRoute}`;

describe("Convention Form (on dev http, prefilled forms false)", () => {
  beforeEach(() => {
    disableUrlLogging();
  });
  it("can edit input date with null / 0 value", () => {
    cy.visit(conventionFormUrl);

    cy.get(`#${domElementIds.conventionImmersionRoute.showFormButton}`).click();

    // Open place / date section
    cy.get(`.fr-accordion`).eq(3).find(".fr-accordion__btn").click();
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.dateStart}`,
    )
      .type("1998-02-03")
      .clear()
      .type("1998-03-21");
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.dateEnd}`,
    )
      .type("1998-02-03")
      .clear()
      .type("1998-05-22");
  });
});
