import { Flavor, ValidateEmailReason } from "shared";

export type EmailableApiKey = Flavor<string, "EmailableApiKey">;

export type EmailableEmailValidationParams = {
  email: string;
  api_key: EmailableApiKey;
};
export type EmailableEmailValidationStatus = {
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
  reason: ValidateEmailReason;
  role: boolean;
  score: number;
  smtp_provider: string | null;
  state: "deliverable" | "undeliverable" | "unknown" | "risky";
  tag: string | null;
  user: string;
};
