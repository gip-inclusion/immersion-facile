import { Observable, of } from "rxjs";
import {
  AbsoluteUrl,
  ConventionSupportedJwt,
  Email,
  FeatureFlags,
  ValidateEmailStatus,
  sleep,
} from "shared";
import { makeStubFeatureFlags } from "src/core-logic/domain/testHelpers/test.helpers";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";

export class SimulatedTechnicalGateway implements TechnicalGateway {
  public getAllFeatureFlags$ = (): Observable<FeatureFlags> =>
    of(makeStubFeatureFlags());

  public htmlToPdf = (
    _htmlContent: string,
    _jwt: ConventionSupportedJwt,
  ): Promise<string> => Promise.resolve("YWJjZA==");

  constructor(private simulatedLatencyMs: number | undefined = undefined) {}

  public async getEmailStatus(email: Email): Promise<ValidateEmailStatus> {
    if (this.simulatedLatencyMs) await sleep(this.simulatedLatencyMs);
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
    // eslint-disable-next-line no-console
    console.log("logo uploaded : ", file);
    return `http://${file.name}-${renameFileToId}-url`;
  }
}
