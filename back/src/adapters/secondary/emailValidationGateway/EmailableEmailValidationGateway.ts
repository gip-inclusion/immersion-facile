import {
  createTargets,
  type CreateTargets,
  type HttpClient,
  type Target,
} from "http-client";
import {
  EmailValidationReason,
  EmailValidationStatus,
  Flavor,
  isValidEmail,
} from "shared";
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
  reason: EmailValidationReason;
  role: boolean;
  score: number;
  smtp_provider: string | null;
  state: "deliverable" | "undeliverable" | "unknown" | "risky";
  tag: string | null;
  user: string;
};

export type EmailableApiKey = Flavor<string, "EmailableApiKey">;

type EmailValidationParams = {
  email: string;
  api_key: EmailableApiKey;
};
export const emailableVerifyApiUrl =
  "https://api.emailable.com/v1/verify" as const;

export type EmailableValidationTargets = CreateTargets<{
  getEmailStatus: Target<
    void,
    EmailValidationParams,
    void,
    typeof emailableVerifyApiUrl
  >;
}>;

export const emailableValidationTargets =
  createTargets<EmailableValidationTargets>({
    getEmailStatus: {
      method: "GET",
      url: emailableVerifyApiUrl,
    },
  });

const logger = createLogger(__filename);

const getEmailValidityStatus = (
  state: EmailableEmailValidationStatus["state"],
  reason: EmailableEmailValidationStatus["reason"],
) => {
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
};
export class EmailableEmailValidationGateway implements EmailValidationGetaway {
  constructor(
    private readonly httpClient: HttpClient<EmailableValidationTargets>,
    private emailableApiKey: EmailableApiKey,
  ) {}

  public async getEmailStatus(email: string): Promise<EmailValidationStatus> {
    if (email === "" || !isValidEmail(email))
      return {
        isFree: false,
        isValid: false,
        proposal: null,
        reason: "invalid_email",
      };

    const { responseBody } = await this.httpClient
      .getEmailStatus({
        queryParams: {
          email,
          api_key: this.emailableApiKey,
        },
      })
      .catch((error) => {
        logger.error("Error while calling emailable API", { error });
        throw error;
      });

    const emailableEmailValidationStatus =
      responseBody as EmailableEmailValidationStatus;
    const response: EmailValidationStatus = {
      isValid: getEmailValidityStatus(
        emailableEmailValidationStatus.state,
        emailableEmailValidationStatus.reason,
      ),
      reason: emailableEmailValidationStatus.reason,
    };
    if (emailableEmailValidationStatus.free) {
      response.isFree = true;
    }
    if (emailableEmailValidationStatus.did_you_mean) {
      response.proposal = emailableEmailValidationStatus.did_you_mean;
    }
    return response;
  }
}
