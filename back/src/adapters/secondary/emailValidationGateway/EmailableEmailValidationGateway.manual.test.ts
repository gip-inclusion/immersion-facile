import {
  EmailableApiKey,
  emailValidationTargets,
  EmailValidationStatus,
  EmailValidationTargets,
} from "shared";
import { EmailValidationGetaway } from "../../../domain/emailValidation/ports/EmailValidationGateway";
import { AppConfig } from "../../primary/config/appConfig";
import {
  createHttpAddressClient,
  EmailableEmailValidationGateway,
} from "./EmailableEmailValidationGateway";

const apiKeyEmailable = AppConfig.createFromEnv()
  .emailableApiKey as EmailableApiKey;
describe("Emailable email validation gateway", () => {
  let emailableEmailValidationGateway: EmailValidationGetaway;

  beforeEach(() => {
    emailableEmailValidationGateway = new EmailableEmailValidationGateway(
      createHttpAddressClient<EmailValidationTargets>(emailValidationTargets),
      apiKeyEmailable,
    );
  });

  describe("Emailable getEmailStatus", () => {
    const candidates: {
      candidateEmail: string;
      expectedStatus: EmailValidationStatus;
    }[] = [
      {
        candidateEmail: "enguerran.weiss@beta.gouv.fr",
        expectedStatus: {
          isValid: true,
          proposal: null,
          isFree: false,
          reason: "accepted_email",
        },
      },
      {
        candidateEmail: "enguerranweiss@beta.gouv.fr",
        expectedStatus: {
          isValid: false,
          proposal: null,
          isFree: false,
          reason: "rejected_email",
        },
      },
      {
        candidateEmail: "this-email-doesnt-exist@gamil.com",
        expectedStatus: {
          isValid: false,
          proposal: "this-email-doesnt-exist@gmail.com",
          isFree: false,
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
        expectedStatus: EmailValidationStatus;
      }) => {
        const emailStatus =
          await emailableEmailValidationGateway.getEmailStatus(candidateEmail);
        expect(emailStatus).toEqual(expectedStatus);
      },
      10000,
    );
  });
});
