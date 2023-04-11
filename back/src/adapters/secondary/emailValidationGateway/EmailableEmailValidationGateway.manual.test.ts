import { ValidateEmailStatus } from "shared";
import { EmailValidationGetaway } from "../../../domain/emailValidation/ports/EmailValidationGateway";
import { AppConfig } from "../../primary/config/appConfig";
import { createExternalHttpClient } from "../../primary/config/createGateways";
import {
  EmailableEmailValidationGateway,
  emailableValidationTargets,
  EmailableValidationTargets,
} from "./EmailableEmailValidationGateway";

describe("Emailable email validation gateway", () => {
  let emailableEmailValidationGateway: EmailValidationGetaway;

  beforeEach(() => {
    const apiKeyEmailable = AppConfig.createFromEnv().emailableApiKey;

    emailableEmailValidationGateway = new EmailableEmailValidationGateway(
      createExternalHttpClient<EmailableValidationTargets>(
        emailableValidationTargets,
      ),
      apiKeyEmailable,
    );
  });

  describe("Emailable getEmailStatus", () => {
    const candidates: {
      candidateEmail: string;
      expectedStatus: ValidateEmailStatus;
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
        candidateEmail: "",
        expectedStatus: {
          isValid: false,
          proposal: null,
          reason: "invalid_email",
        },
      },
      {
        candidateEmail: "ezflmafmkazflmkazf",
        expectedStatus: {
          isValid: false,
          proposal: null,
          reason: "invalid_email",
        },
      },
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
      "Candidate email should match expected given status",
      async ({
        candidateEmail,
        expectedStatus,
      }: {
        candidateEmail: string;
        expectedStatus: ValidateEmailStatus;
      }) => {
        const emailStatus = await emailableEmailValidationGateway.validateEmail(
          candidateEmail,
        );
        expect(emailStatus).toEqual(expectedStatus);
      },
      10000,
    );
  });
});
