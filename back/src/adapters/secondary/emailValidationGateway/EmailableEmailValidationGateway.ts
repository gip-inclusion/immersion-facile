import {
  createTargets,
  type CreateTargets,
  type HttpClient,
  type Target,
} from "http-client";
import { ValidateEmailReason, ValidateEmailStatus, Flavor } from "shared";
import { EmailValidationGetaway } from "../../../domain/emailValidation/ports/EmailValidationGateway";
import { createLogger } from "../../../utils/logger";

type EmailableEmailValidationStatus = {
  accept_all: boolean;
  did_you_mean: string;
  disposable: boolean;
  domain: string;
  duration: number;
  email: string;
  first_name: string | null;
  free: boolean;
  full_name: string | null;
  gender: string | null;
  last_name: string | null;
  mailbox_full: boolean;
  mx_record: string;
  no_reply: boolean;
  reason: ValidateEmailReason;
  role: boolean;
  score: number;
  smtp_provider: string | null;
  state: "deliverable" | "undeliverable" | "unknown" | "risky";
  tag: string | null;
  user: string;
};

export type EmailableApiKey = Flavor<string, "EmailableApiKey">;

type EmailableEmailValidationParams = {
  email: string;
  api_key: EmailableApiKey;
};
export const emailableVerifyApiUrl =
  "https://api.emailable.com/v1/verify" as const;

export type EmailableValidationTargets = CreateTargets<{
  validateEmail: Target<
    void,
    EmailableEmailValidationParams,
    void,
    typeof emailableVerifyApiUrl
  >;
}>;

export const emailableValidationTargets =
  createTargets<EmailableValidationTargets>({
    validateEmail: {
      method: "GET",
      url: emailableVerifyApiUrl,
    },
  });

const logger = createLogger(__filename);

export class EmailableEmailValidationGateway implements EmailValidationGetaway {
  constructor(
    private readonly httpClient: HttpClient<EmailableValidationTargets>,
    private emailableApiKey: EmailableApiKey,
  ) {}

  private isEmailValid(
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
    ];
    return unacceptableStates.includes(state) ||
      unacceptableReasons.includes(reason)
      ? false
      : true;
  }

  public async validateEmail(email: string): Promise<ValidateEmailStatus> {
    const { responseBody } = await this.httpClient
      .validateEmail({
        queryParams: {
          email,
          api_key: this.emailableApiKey,
        },
      })
      .catch((error) => {
        logger.error("validateEmail => Error while calling emailable API ", {
          error,
        });
        throw error;
      });
    const emailableEmailValidationStatus =
      responseBody as EmailableEmailValidationStatus;

    return {
      isValid: this.isEmailValid(
        emailableEmailValidationStatus.state,
        emailableEmailValidationStatus.reason,
      ),
      reason: emailableEmailValidationStatus.reason,
      ...(emailableEmailValidationStatus.did_you_mean && {
        proposal: emailableEmailValidationStatus.did_you_mean,
      }),
    };
  }
}
