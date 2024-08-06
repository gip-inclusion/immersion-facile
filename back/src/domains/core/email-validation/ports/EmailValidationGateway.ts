import { ValidateEmailFeedback } from "shared";

export interface EmailValidationGetaway {
  validateEmail(email: string): Promise<ValidateEmailFeedback>;
}
