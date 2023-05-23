import { Flavor, ValidateEmailReason } from "shared";

export type EmailableApiKey = Flavor<string, "EmailableApiKey">;

export type EmailableEmailValidationParams = {
  email: string;
  api_key: EmailableApiKey;
};
export type EmailableEmailValidationStatus = {
  accept_all?: boolean | null;
  did_you_mean?: string | null;
  disposable?: boolean | null;
  domain?: string | null;
  duration?: number | null;
  email?: string | null;
  first_name?: string | null;
  free?: boolean | null;
  full_name?: string | null;
  gender?: string | null;
  last_name?: string | null;
  mailbox_full?: boolean | null;
  mx_record?: string | null;
  no_reply?: boolean | null;
  reason: ValidateEmailReason;
  role?: boolean | null;
  score?: number | null;
  smtp_provider?: string | null;
  state?: "deliverable" | "undeliverable" | "unknown" | "risky";
  tag?: string | null;
  user?: string | null;
};
