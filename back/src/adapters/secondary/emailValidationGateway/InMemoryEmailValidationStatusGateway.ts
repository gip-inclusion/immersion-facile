import { EmailValidationStatus } from "shared";
import { EmailValidationGetaway } from "../../../domain/emailValidation/ports/EmailValidationGateway";

export class InMemoryEmailValidationGateway implements EmailValidationGetaway {
  private emailValidationStatus: EmailValidationStatus | undefined;

  public async getEmailStatus(_email: string): Promise<EmailValidationStatus> {
    if (this.emailValidationStatus) return this.emailValidationStatus;
    throw new Error("No email validation status provided (in memory)");
  }

  // for test purposes only
  public setEmailValidationStatusResponse(
    emailValidationStatus: EmailValidationStatus,
  ) {
    this.emailValidationStatus = emailValidationStatus;
  }
}
