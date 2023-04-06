import {
  defaultErrorStatus,
  EmailValidationStatus,
  isValidEmail,
} from "shared";
import { EmailValidationGetaway } from "../../../domain/emailValidation/ports/EmailValidationGateway";

export class InMemoryEmailValidationGateway implements EmailValidationGetaway {
  private emailValidationStatus: EmailValidationStatus | undefined;

  public async getEmailStatus(email: string): Promise<EmailValidationStatus> {
    if (this.emailValidationStatus) return this.emailValidationStatus;
    if (email === "" || !isValidEmail(email)) return defaultErrorStatus;
    if (email === "email-with-typo@gamil.com")
      return {
        isValid: false,
        reason: "rejected_email",
        proposal: "email-with-typo@gmail.com",
      };
    return {
      isValid: true,
      reason: "accepted_email",
      isFree: true,
    };
  }

  // for test purposes only
  public setEmailValidationStatusResponse(
    emailValidationStatus: EmailValidationStatus,
  ) {
    this.emailValidationStatus = emailValidationStatus;
  }
}
