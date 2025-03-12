import type { ValidateEmailFeedback } from "shared";

export interface EmailValidationGetaway {
  validateEmail(email: string): Promise<ValidateEmailFeedback>;
}
