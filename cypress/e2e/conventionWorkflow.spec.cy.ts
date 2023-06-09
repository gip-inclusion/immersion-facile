import {
  domElementIds,
  signConventionRoute,
  updateConventionStatusRoute,
} from "../../shared/src";

const baseApiRoute = "/api/";
const selectedAgencyId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("Convention full workflow", () => {
  const conventionData = {
    conventionId: null,
    magicLinks: [],
  };
  beforeEach(() => {
    cy.disableUrlLogging();
  });
  it("creates a new convention", () => {
    cy.submitBasicConventionForm();
    cy.wait(20000);
  });

  it("get signatories magicLink urls from email", () => {
    const maxEmails = 2;
    cy.openEmailInAdmin({
      emailType: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
    }).then(($emailWrapper) => {
      $emailWrapper.find("span:contains('magicLink')").each((index, $span) => {
        if (index < maxEmails) {
          const magicLinkUrl = Cypress.$($span).next().find("a").attr("href");
          conventionData.magicLinks.push(magicLinkUrl);
        }
      });
    });
  });
  it("signs convention for first signatory and validator requires modification", () => {
    cy.intercept(
      "POST",
      `${baseApiRoute}auth/${updateConventionStatusRoute}/${conventionData.conventionId}`,
    ).as("updateConventionRequest");
    signatorySignConvention(conventionData.magicLinks[0]);
    cy.openEmailInAdmin({
      emailType: "NEW_CONVENTION_AGENCY_NOTIFICATION",
    }).then(($emailWrapper) => {
      conventionData.conventionId = $emailWrapper
        .find("span:contains('conventionId')")
        .next()
        .text();
      cy.getMagicLinkInEmailWrapper($emailWrapper).click();
      cy.get(
        `#${domElementIds.manageConvention.conventionValidationRequestEditButton}`,
      ).click();
      cy.get("#draft-modal [name='statusJustification']").type(
        "Raison de la demande de modification",
      );
      cy.get(
        `#draft-modal #${domElementIds.manageConvention.justificationModalSubmitButton}`,
      ).click({
        force: true,
      });
      cy.wait("@updateConventionRequest")
        .its("response.statusCode")
        .should("eq", 200);
      cy.get(".fr-alert--success").should("exist");
    });
  });
  it("signatory edit the convention and submit it", () => {
    cy.openEmailInAdmin({
      emailType: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
    }).then(($emailWrapper) => {
      cy.getMagicLinkInEmailWrapper($emailWrapper).then(($link) => {
        editConventionForm($link.attr("href"));
      });
    });
  });
  it("signs convention for signatories", () => {
    cy.intercept(
      "POST",
      `${baseApiRoute}auth/${signConventionRoute}/${conventionData.conventionId}`,
    ).as("signConventionRequest");
    conventionData.magicLinks.forEach(signatorySignConvention);
  });
  it("reviews and validate convention", () => {
    cy.wait(10000);
    cy.intercept(
      "POST",
      `${baseApiRoute}auth/${updateConventionStatusRoute}/**`,
    ).as("reviewConventionRequest");
    cy.openEmailInAdmin({
      emailType: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
    }).then(($emailWrapper) => {
      cy.getMagicLinkInEmailWrapper($emailWrapper).click();
      cy.get(
        `#${domElementIds.manageConvention.conventionValidationValidateButton}`,
      ).click();
      cy.wait("@reviewConventionRequest")
        .its("response.statusCode")
        .should("eq", 200);
      cy.get(".fr-alert--success").should("exist");
    });
  });
});

const signatorySignConvention = (magicLink) => {
  cy.intercept("POST", `${baseApiRoute}auth/${signConventionRoute}/**`).as(
    "signConventionRequest",
  );
  cy.visit(magicLink);
  cy.get(".im-signature-actions__checkbox input").not(":checked").check();
  cy.get(`#${domElementIds.conventionToSign.submitButton}`).should(
    "not.be.disabled",
  );
  cy.get(`#${domElementIds.conventionToSign.submitButton}`).click();
  cy.wait("@signConventionRequest")
    .its("response.statusCode")
    .should("eq", 200);
};

const editConventionForm = (magicLinkUrl) => {
  cy.visit(magicLinkUrl);
  cy.get(
    `#${domElementIds.conventionImmersionRoute.conventionSection.agencyId}`,
  ).then(($element) => {
    cy.get(
      `#${domElementIds.conventionImmersionRoute.conventionSection.agencyId}`,
    ).should("have.value", selectedAgencyId);
  });
};
