import { Subject } from "rxjs";
import {
  AbsoluteUrl,
  ConventionSupportedJwt,
  Email,
  FeatureFlags,
  ValidateEmailStatus,
} from "shared";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";

export class TestTechnicalGateway implements TechnicalGateway {
  // test purposes only
  public featureFlags$ = new Subject<FeatureFlags>();

  public getAllFeatureFlags$ = () => this.featureFlags$;

  public htmlToPdf = (
    _htmlContent: string,
    _jwt: ConventionSupportedJwt,
  ): Promise<string> => Promise.resolve("YWJjZA==");

  // eslint-disable-next-line @typescript-eslint/require-await
  public async getEmailStatus(email: Email): Promise<ValidateEmailStatus> {
    const emailWithErrorStatus: ValidateEmailStatus = {
      isValid: false,
      proposal: "",
      reason: "invalid_email",
    };
    const emailWithTypoStatus: ValidateEmailStatus = {
      isValid: false,
      proposal: "email-with-typo@gmail.com",
      reason: "invalid_email",
    };
    if (email === "email-with-error@example.com") return emailWithErrorStatus;
    if (email === "email-with-typo@gamil.com") return emailWithTypoStatus;
    return {
      isValid: true,
      reason: "accepted_email",
      proposal: null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async uploadFile(
    file: File,
    renameFileToId: boolean,
  ): Promise<AbsoluteUrl> {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("logo uploaded : ", file);
    return `http://${file.name}-${renameFileToId}-url`;
  }
}
