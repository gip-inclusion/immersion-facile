import { Email } from "./email.dto";

export const validateEmailStatuses = [
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
  "no_connect",
  "service_unavailable",
] as const;

export type ValidateEmailStatus = (typeof validateEmailStatuses)[number];

export type ValidateEmailFeedback = {
  status: ValidateEmailStatus;
  proposal: string | null;
};

export const validateMultipleEmailRegex =
  /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

export type ValidateEmailInput = { email: Email };
