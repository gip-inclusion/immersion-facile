import { frontRoutes, domElementIds } from "shared";

import { disableNewUrlLog } from "../utils";
import { basicFormConvention } from "../utils/forms";

const conventionFormUrl = `${frontRoutes.conventionImmersionRoute}`;

describe("Convention Form (on dev http, prefilled forms false)", () => {
  beforeEach(() => {
    disableNewUrlLog();
  });
  it("can submit form with basic infos", () => {
    basicFormConvention();
  });
  it.skip("can't submit form if immersion duration exceeds 1 month", () => {});
  it.skip("can submit form with a complex schedule", () => {});
  it.skip("can edit multiple jobs dropdown", () => {});
  it("can edit input date with null / 0 value", () => {
    cy.visit(conventionFormUrl);
    cy.get(`#${domElementIds.conventionImmersionRoute.showFormButton}`).click();
    // Open place / date section
    cy.get(`#im-convention-form__step-3 .fr-accordion__btn`).click();
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
