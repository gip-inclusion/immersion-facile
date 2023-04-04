import axios from "axios";
import {
  configureHttpClient,
  createAxiosHandlerCreator,
  type HttpClient,
  type CreateTargets,
  type Target,
  createTargets,
} from "http-client";
import { EmailValidationReason, EmailValidationStatus, Flavor } from "shared";
import { EmailValidationGetaway } from "../../../domain/emailValidation/ports/EmailValidationGateway";

const AXIOS_TIMEOUT_MS = 10_000;

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

export const emailableExternalTargets =
  createTargets<EmailableValidationTargets>({
    getEmailStatus: {
      method: "GET",
      url: emailableVerifyApiUrl,
    },
  });

export const createHttpAddressClient = configureHttpClient(
  createAxiosHandlerCreator(axios.create({ timeout: AXIOS_TIMEOUT_MS })),
);

export class EmailableEmailValidationGateway implements EmailValidationGetaway {
  constructor(
    private readonly httpClient: HttpClient<EmailableValidationTargets>,
    private emailableApiKey: EmailableApiKey,
  ) {}

  public async getEmailStatus(email: string): Promise<EmailValidationStatus> {
    const { responseBody } = await this.httpClient.getEmailStatus({
      queryParams: {
        email,
        api_key: this.emailableApiKey,
      },
    });
    const emailableEmailValidationStatus =
      responseBody as EmailableEmailValidationStatus;
    return {
      isFree: emailableEmailValidationStatus.free,
      isValid:
        emailableEmailValidationStatus.state === "deliverable" ||
        emailableEmailValidationStatus.reason === "accepted_email",
      reason: emailableEmailValidationStatus.reason,
      proposal: emailableEmailValidationStatus.did_you_mean,
    };
  }
}
