import { Email } from "./email.dto";

export const validateEmailReason = [
  "accepted_email",
  "disposable_email",
  "invalid_domain",
  "invalid_email",
  "invalid_smtp",
  "low_deliverability",
  "low_quality",
  "rejected_email",
  "unavailable_smtp",
  "unexpected_error",
] as const;

export type ValidateEmailReason = (typeof validateEmailReason)[number];

export type ValidateEmailStatus = {
  isValid: boolean;
  proposal?: string | null;
  reason?: ValidateEmailReason | null;
};

export const validateMultipleEmailRegex =
  /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

export type ValidateEmailInput = { email: Email };
