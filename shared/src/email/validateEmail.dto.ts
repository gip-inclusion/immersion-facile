import { Email } from "./email.dto";

export const validateEmailReason = [
  "accepted_email",
  "invalid_email",
  "rejected_email",
  "invalid_smtp",
  "invalid_domain",
  "disposable_email",
  "low_deliverability",
  "low_quality",
  "unexpected_error",
] as const;

export type ValidateEmailReason = (typeof validateEmailReason)[number];

export type ValidateEmailStatus = {
  isValid: boolean;
  proposal?: string | null;
  reason: ValidateEmailReason;
};

export const validateEmailRegex =
  /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

export type ValidateEmailInput = { email: Email };
