export const emailValidationReason = [
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

export type EmailValidationReason = (typeof emailValidationReason)[number];

export type EmailValidationStatus = {
  isValid: boolean;
  proposal?: string | null;
  isFree?: boolean;
  reason: EmailValidationReason;
};

export const emailValidationRegex =
  /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

export const isValidEmail = (email: string): boolean =>
  (email.match(emailValidationRegex) || []).length > 0;

export const defaultErrorStatus: EmailValidationStatus = {
  isValid: false,
  reason: "invalid_domain",
};
