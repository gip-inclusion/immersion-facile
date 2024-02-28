import { ValidateEmailStatus } from "shared";

export interface EmailValidationGetaway {
  validateEmail(email: string): Promise<ValidateEmailStatus>;
}
