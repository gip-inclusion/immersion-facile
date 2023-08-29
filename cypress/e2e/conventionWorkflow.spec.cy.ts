import { faker } from "@faker-js/faker/locale/fr";
import {
  agencyRoutes,
  conventionMagicLinkTargets,
  domElementIds,
  peParisAgencyId,
} from "shared";
import { disableUrlLogging } from "../cypress/utils/log";
import { addBusinessDays, format } from "date-fns";

const { baseApiRoute, defaultFieldOptions, timeForEventCrawler } =
  Cypress.env("config");

describe("Convention full workflow", () => {
  const conventionData = {
    magicLinks: [],
  };
  beforeEach(() => {
    disableUrlLogging();
  });
  it("creates a new convention", () => {
    cy.submitBasicConventionForm();
    cy.wait(timeForEventCrawler);
  });

  it("get signatories magicLink urls from email", () => {
    const maxEmails = 2;
    cy.connectToAdmin();
    for (let index = 0; index < maxEmails; index++) {
      cy.openEmailInAdmin({
        emailType: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
        elementIndex: index,
      }).then(($emailWrapper) => {
        $emailWrapper
          .find("span:contains('conventionSignShortlink')")
          .each((index, $span) => {
            const magicLinkUrl = Cypress.$($span).next().find("a").attr("href");
            conventionData.magicLinks.push(magicLinkUrl);
          });
      });
    }
  });
  it("signs convention for first signatory and validator requires modification", () => {
    cy.intercept(
      "POST",
      `${baseApiRoute}${conventionMagicLinkTargets.updateConventionStatus.url.replace(
        ":conventionId",
        "**",
      )}`,
    ).as("updateConventionRequest");
    signatorySignConvention(conventionData.magicLinks[0]);
    cy.connectToAdmin();
    cy.openEmailInAdmin({
      emailType: "NEW_CONVENTION_AGENCY_NOTIFICATION",
      elementIndex: 0,
    })
      .last()
      .then(($emailWrapper) => {
        cy.getMagicLinkInEmailWrapper($emailWrapper).click();
        cy.get(
          `#${domElementIds.manageConvention.conventionValidationRequestEditButton}`,
        ).click();
        cy.get("#draft-modal [name='statusJustification']").type(
          "Raison de la demande de modification",
        );
        cy.get(
          `#draft-modal #${domElementIds.manageConvention.justificationModalSubmitButton}`,
        ).click(defaultFieldOptions);
        cy.wait("@updateConventionRequest")
          .its("response.statusCode")
          .should("eq", 200);
        cy.get(".fr-alert--success").should("exist");
      });
    cy.wait(timeForEventCrawler);
  });
  it("signatory edit the convention and re-submit it", () => {
    cy.connectToAdmin();
    cy.openEmailInAdmin({
      emailType: "CONVENTION_MODIFICATION_REQUEST_NOTIFICATION",
      elementIndex: 0,
    }).then(($emailWrapper) => {
      cy.getMagicLinkInEmailWrapper($emailWrapper).then(($link) => {
        editConventionForm($link.attr("href"));
        conventionData.magicLinks = [];
      });
    });
  });
  it("signs convention for signatories", () => {
    cy.intercept(
      "POST",
      `${baseApiRoute}${conventionMagicLinkTargets.signConvention.url.replace(
        ":conventionId",
        "**",
      )}`,
    ).as("signConventionRequest");
    cy.connectToAdmin();
    cy.visit("/admin/conventions"); // ensure we're on backoffice
    cy.openEmailInAdmin({
      emailType: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
      elementIndex: 0,
    }).then(($emailWrapper) => {
      $emailWrapper
        .find("span:contains('conventionSignShortlink')")
        .each((_, $span) => {
          const magicLinkUrl = Cypress.$($span).next().find("a").attr("href");
          signatorySignConvention(magicLinkUrl);
        });
    });
    cy.visit("/admin/conventions"); // ensure we're on backoffice
    cy.openEmailInAdmin({
      emailType: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
      elementIndex: 1,
    }).then(($emailWrapper) => {
      $emailWrapper
        .find("span:contains('conventionSignShortlink')")
        .each((_, $span) => {
          const magicLinkUrl = Cypress.$($span).next().find("a").attr("href");
          signatorySignConvention(magicLinkUrl);
        });
    });
  });
  it("reviews and validate convention", () => {
    cy.wait(timeForEventCrawler);
    cy.intercept(
      "POST",
      `${baseApiRoute}${conventionMagicLinkTargets.updateConventionStatus.url.replace(
        ":conventionId",
        "**",
      )}`,
    ).as("reviewConventionRequest");
    cy.connectToAdmin();
    cy.openEmailInAdmin({
      emailType: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
      elementIndex: 0,
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
  cy.intercept(
    "POST",
    `${baseApiRoute}${conventionMagicLinkTargets.signConvention.url.replace(
      ":conventionId",
      "**",
    )}`,
  ).as("signConventionRequest");
  cy.intercept(
    "GET",
    `${baseApiRoute}${conventionMagicLinkTargets.getConvention.url.replace(
      ":conventionId",
      "**",
    )}`,
  ).as("getConventionByIdRequest");
  cy.intercept(
    "GET",
    `${baseApiRoute}${agencyRoutes.getAgencyPublicInfoById.url}?agencyId=${peParisAgencyId}`,
  ).as("getAgencyPublicInfoByIdRequest");
  cy.visit(magicLink);
  cy.wait("@getConventionByIdRequest");
  cy.wait("@getAgencyPublicInfoByIdRequest");
  cy.get(".im-signature-actions__checkbox input")
    .not(":checked")
    .check({ force: true });
  cy.get(`#${domElementIds.conventionToSign.submitButton}`).should(
    "not.be.disabled",
  );
  cy.get(`#${domElementIds.conventionToSign.submitButton}`).click({
    force: true,
  });
  cy.wait("@signConventionRequest")
    .its("response.statusCode")
    .should("eq", 200);
};

const editConventionForm = (magicLinkUrl) => {
  cy.intercept(
    "POST",
    `${baseApiRoute}${conventionMagicLinkTargets.updateConvention.url.replace(
      ":conventionId",
      "**",
    )}`,
  ).as("conventionEditRequest");
  cy.visit(magicLinkUrl);
  cy.get(
    `#${domElementIds.conventionImmersionRoute.conventionSection.agencyId}`,
  ).should("have.value", peParisAgencyId);
  cy.get(`#im-convention-form__step-2 .fr-accordion__btn`).click();
  cy.get(
    `#${domElementIds.conventionImmersionRoute.establishmentTutorSection.job}`,
  )
    .clear()
    .type(faker.name.jobTitle());
  cy.get(`#im-convention-form__step-3 .fr-accordion__btn`).click();
  cy.get(`#${domElementIds.conventionImmersionRoute.conventionSection.dateEnd}`)
    .clear()
    .type(format(addBusinessDays(new Date(), 5), "yyyy-MM-dd"));
  cy.get(
    `#${domElementIds.conventionImmersionRoute.conventionSection.addHoursButton}`,
  ).click();
  cy.get(`#${domElementIds.conventionImmersionRoute.submitFormButton}`)
    .click()
    .then(() => {
      cy.get(".im-convention-summary").should("exist");
      cy.get(
        `#${domElementIds.conventionImmersionRoute.confirmSubmitFormButton}`,
      ).click();
      cy.wait("@conventionEditRequest")
        .its("response.statusCode")
        .should("eq", 200);
    });
  cy.wait(timeForEventCrawler);
};
