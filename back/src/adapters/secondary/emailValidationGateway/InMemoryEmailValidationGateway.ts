import { ValidateEmailStatus } from "shared";
import { EmailValidationGetaway } from "../../../domain/emailValidation/ports/EmailValidationGateway";

export class InMemoryEmailValidationGateway implements EmailValidationGetaway {
  #emailValidationStatus: ValidateEmailStatus | undefined;

  // for test purposes only
  public setEmailValidationStatusResponse(
    emailValidationStatus: ValidateEmailStatus,
  ) {
    this.#emailValidationStatus = emailValidationStatus;
  }

  public async validateEmail(email: string): Promise<ValidateEmailStatus> {
    if (this.#emailValidationStatus) return this.#emailValidationStatus;
    if (email === "email-with-typo@gamil.com")
      return {
        isValid: false,
        reason: "rejected_email",
        proposal: "email-with-typo@gmail.com",
      };
    return {
      isValid: true,
      reason: "accepted_email",
    };
  }
}
