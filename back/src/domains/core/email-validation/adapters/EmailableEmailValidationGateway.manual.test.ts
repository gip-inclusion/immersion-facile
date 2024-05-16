import axios from "axios";
import { ValidateEmailStatus, expectToEqual } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { EmailValidationGetaway } from "../ports/EmailValidationGateway";
import { EmailableEmailValidationGateway } from "./EmailableEmailValidationGateway";
import { emailableValidationRoutes } from "./EmailableEmailValidationGateway.routes";

describe("EmailableEmailValidationGateway", () => {
  let emailableEmailValidationGateway: EmailValidationGetaway;

  beforeEach(() => {
    emailableEmailValidationGateway = new EmailableEmailValidationGateway(
      createAxiosSharedClient(emailableValidationRoutes, axios),
      AppConfig.createFromEnv().emailableApiKey,
    );
  });

  describe("Emailable validateEmail", () => {
    const candidates: {
      candidateEmail: string;
      expectedStatus: ValidateEmailStatus | Error;
    }[] = [
      {
        candidateEmail: "enguerran.weiss@beta.gouv.fr",
        expectedStatus: {
          isValid: true,
          proposal: null,
          reason: "accepted_email",
        },
      },
      {
        candidateEmail: "enguerranweiss@beta.gouv.fr",
        expectedStatus: {
          isValid: false,
          proposal: null,
          reason: "rejected_email",
        },
      },
      {
        candidateEmail: "this-email-doesnt-exist@gamil.com",
        expectedStatus: {
          isValid: false,
          proposal: "this-email-doesnt-exist@gmail.com",
          reason: "rejected_email",
        },
      },
    ];

    it.each(candidates)(
      "Candidate email '$candidateEmail' should match expected given status",
      async ({ candidateEmail, expectedStatus }) => {
        expectToEqual(
          await emailableEmailValidationGateway.validateEmail(candidateEmail),
          expectedStatus,
        );
      },
      10000,
    );
  });
});
