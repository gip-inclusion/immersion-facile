import { EmailValidationStatus } from "shared";

export interface EmailValidationGetaway {
  getEmailStatus(email: string): Promise<EmailValidationStatus>;
}
