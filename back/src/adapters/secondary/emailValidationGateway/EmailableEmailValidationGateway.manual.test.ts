import { ValidateEmailStatus } from "shared";
import { EmailValidationGetaway } from "../../../domain/emailValidation/ports/EmailValidationGateway";
import { AppConfig } from "../../primary/config/appConfig";
import { configureCreateHttpClientForExternalApi } from "../../primary/config/createGateways";
import {
  EmailableEmailValidationGateway,
  emailableValidationTargets,
} from "./EmailableEmailValidationGateway";

describe("Emailable email validation gateway", () => {
  let emailableEmailValidationGateway: EmailValidationGetaway;

  beforeEach(() => {
    const apiKeyEmailable = AppConfig.createFromEnv().emailableApiKey;

    emailableEmailValidationGateway = new EmailableEmailValidationGateway(
      configureCreateHttpClientForExternalApi()(emailableValidationTargets),
      apiKeyEmailable,
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
          reason: "accepted_email",
        },
      },
      {
        candidateEmail: "enguerranweiss@beta.gouv.fr",
        expectedStatus: {
          isValid: false,
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
        const emailStatus = await emailableEmailValidationGateway.validateEmail(
          candidateEmail,
        );
        expect(emailStatus).toEqual(expectedStatus);
      },
      10000,
    );
  });
});
