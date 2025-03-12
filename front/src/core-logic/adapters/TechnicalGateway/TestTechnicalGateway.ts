import { Subject } from "rxjs";
import type {
  AbsoluteUrl,
  ConventionSupportedJwt,
  Email,
  FeatureFlags,
  HtmlToPdfRequest,
  ValidateEmailFeedback,
} from "shared";
import type { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";

export class TestTechnicalGateway implements TechnicalGateway {
  // test purposes only
  public featureFlags$ = new Subject<FeatureFlags>();

  public getAllFeatureFlags$ = () => this.featureFlags$;

  public htmlToPdf = (
    _htmlContent: HtmlToPdfRequest,
    _jwt: ConventionSupportedJwt,
  ): Promise<string> => Promise.resolve("YWJjZA==");

  public async getEmailStatus(email: Email): Promise<ValidateEmailFeedback> {
    const emailWithErrorStatus: ValidateEmailFeedback = {
      status: "invalid_email",
      proposal: null,
    };
    const emailWithTypoStatus: ValidateEmailFeedback = {
      proposal: "email-with-typo@gmail.com",
      status: "invalid_email",
    };
    if (email === "email-with-error@example.com") return emailWithErrorStatus;
    if (email === "email-with-typo@gamil.com") return emailWithTypoStatus;
    return {
      status: "accepted_email",
      proposal: null,
    };
  }

  public async uploadFile(file: File): Promise<AbsoluteUrl> {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("logo uploaded : ", file);
    return `http://${file.name}-url`;
  }
}
