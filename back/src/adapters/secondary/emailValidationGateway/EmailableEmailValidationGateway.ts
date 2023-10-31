import Bottleneck from "bottleneck";
import { ValidateEmailStatus } from "shared";
import { HttpClient } from "shared-routes";
import { EmailValidationGetaway } from "../../../domain/emailValidation/ports/EmailValidationGateway";
import { createLogger } from "../../../utils/logger";
import {
  EmailableApiKey,
  EmailableEmailValidationStatus,
} from "./EmailableEmailValidationGateway.dto";
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

  public async validateEmail(email: string): Promise<ValidateEmailStatus> {
    return this.#limiter
      .schedule(() =>
        this.httpClient.validateEmail({
          queryParams: {
            email,
            api_key: this.emailableApiKey,
          },
        }),
      )
      .then(({ body }) => ({
        isValid: this.#isEmailValid(body.state, body.reason),
        reason: body.reason,
        ...(body.did_you_mean && {
          proposal: body.did_you_mean,
        }),
      }))
      .catch((error) => {
        logger.error(
          { email, error },
          "validateEmail => Error while calling emailable API ",
        );
        throw error;
      });
  }

  #isEmailValid(
    state: EmailableEmailValidationStatus["state"],
    reason: EmailableEmailValidationStatus["reason"],
  ): boolean {
    const unacceptableStates: EmailableEmailValidationStatus["state"][] = [
      "undeliverable",
    ];
    const unacceptableReasons: EmailableEmailValidationStatus["reason"][] = [
      "invalid_domain",
      "invalid_email",
      "invalid_smtp",
      "rejected_email",
      "unexpected_error",
      "no_connect",
    ];
    return unacceptableStates.includes(state) ||
      unacceptableReasons.includes(reason)
      ? false
      : true;
  }
}
