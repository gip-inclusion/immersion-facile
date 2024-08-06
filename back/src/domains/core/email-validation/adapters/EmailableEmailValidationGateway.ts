import Bottleneck from "bottleneck";
import { ValidateEmailFeedback } from "shared";
import { HttpClient } from "shared-routes";
import { createLogger } from "../../../../utils/logger";
import { EmailValidationGetaway } from "../ports/EmailValidationGateway";
import { EmailableApiKey } from "./EmailableEmailValidationGateway.dto";
import { EmailableValidationRoutes } from "./EmailableEmailValidationGateway.routes";

const logger = createLogger(__filename);

const emailableVerifyEmailMaxRatePerSeconds = 25;

export class EmailableEmailValidationGateway implements EmailValidationGetaway {
  #limiter = new Bottleneck({
    reservoir: emailableVerifyEmailMaxRatePerSeconds,
    reservoirRefreshInterval: 1000, // number of ms
    reservoirRefreshAmount: emailableVerifyEmailMaxRatePerSeconds,
  });

  constructor(
    private readonly httpClient: HttpClient<EmailableValidationRoutes>,
    private readonly emailableApiKey: EmailableApiKey,
  ) {}

  public async validateEmail(email: string): Promise<ValidateEmailFeedback> {
    return this.#limiter.schedule(() =>
      this.httpClient
        .validateEmail({
          queryParams: {
            email,
            api_key: this.emailableApiKey,
          },
        })
        .then(({ body: { reason, did_you_mean } }) => ({
          status: reason ?? "unexpected_error",
          proposal: did_you_mean ?? null,
        }))
        .catch((error) => {
          logger.error({
            error,
            message: "validateEmail => Error while calling emailable API ",
          });
          return {
            status: "service_unavailable",
            proposal: null,
          };
        }),
    );
  }
}
