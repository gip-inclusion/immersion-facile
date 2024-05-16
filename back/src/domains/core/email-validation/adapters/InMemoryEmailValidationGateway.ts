import { ValidateEmailStatus } from "shared";
import { EmailValidationGetaway } from "../ports/EmailValidationGateway";

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
    if (email.includes("@donotexist"))
      return {
        isValid: false,
        reason: "invalid_domain",
        proposal: null,
      };
    if (email.includes("donotexist@"))
      return {
        isValid: false,
        reason: "rejected_email",
        proposal: null,
      };
    if (email.includes("error@"))
      return {
        isValid: false,
        reason: "unexpected_error",
        proposal: null,
      };
    if (email === "email-with-typo@gamil.com")
      return {
        isValid: false,
        reason: "rejected_email",
        proposal: "email-with-typo@gmail.com",
      };
    return {
      isValid: true,
      proposal: null,
      reason: "accepted_email",
    };
  }
}
