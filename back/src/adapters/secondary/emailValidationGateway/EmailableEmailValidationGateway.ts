import axios from "axios";
import {
  configureHttpClient,
  createAxiosHandlerCreator,
  type HttpClient,
  type CreateTargets,
  type Target,
  createTargets,
} from "http-client";
import { EmailValidationStatus } from "shared";
import { EmailValidationGetaway } from "../../../domain/emailValidation/ports/EmailValidationGateway";

const AXIOS_TIMEOUT_MS = 10_000;
const emailableVerifyApiUrl = "https://api.emailable.com/v1/verify" as const;

type EmailableEmailValidationStatus = {
  accept_all: boolean;
  did_you_mean: string | null;
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
  reason: string;
  role: boolean;
  score: number;
  smtp_provider: string | null;
  state: string;
  tag: string | null;
  user: string;
};

export type EmailableApiKey = `${"test" | "live"}_${string}`;

type EmailValidationParams = {
  email: string;
  api_key: EmailableApiKey;
};

export type EmailValidationTargets = CreateTargets<{
  getEmailStatus: Target<
    void,
    EmailValidationParams,
    void,
    typeof emailableVerifyApiUrl
  >;
}>;

export const emailableExternalTargets = createTargets<EmailValidationTargets>({
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
    private readonly httpClient: HttpClient<EmailValidationTargets>,
    private emailableApiKey: EmailableApiKey,
  ) {}

  public async getEmailStatus(email: string): Promise<EmailValidationStatus> {
    const { responseBody } = await this.httpClient.getEmailStatus({
      queryParams: {
        email,
        api_key: this.emailableApiKey,
      },
    });
    return responseBody as EmailableEmailValidationStatus;
  }
}
