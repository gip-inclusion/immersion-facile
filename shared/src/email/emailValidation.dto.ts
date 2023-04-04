import { Flavor } from "../typeFlavors";

export type EmailValidationQueryInput = Flavor<
  string,
  "EmailValidationQueryInput"
>;
export type WithEmailInput = { email: EmailValidationQueryInput };
