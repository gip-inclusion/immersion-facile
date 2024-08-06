import { Observable, of } from "rxjs";
import {
  AbsoluteUrl,
  ConventionSupportedJwt,
  Email,
  FeatureFlags,
  ValidateEmailFeedback,
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

  public async getEmailStatus(email: Email): Promise<ValidateEmailFeedback> {
    if (this.simulatedLatencyMs) await sleep(this.simulatedLatencyMs);
    if (email === "email-with-error@example.com")
      return {
        status: "invalid_email",
        proposal: null,
      };
    if (email === "email-with-typo@gamil.com")
      return {
        status: "invalid_email",
        proposal: "email-with-typo@gmail.com",
      };
    return {
      status: "accepted_email",
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
