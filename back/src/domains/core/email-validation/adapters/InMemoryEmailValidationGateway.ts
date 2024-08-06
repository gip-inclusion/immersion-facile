import { ValidateEmailFeedback } from "shared";
import { EmailValidationGetaway } from "../ports/EmailValidationGateway";

export class InMemoryEmailValidationGateway implements EmailValidationGetaway {
  #emailValidationStatus: ValidateEmailFeedback | undefined;

  // for test purposes only
  public setEmailValidationStatusResponse(
    emailValidationStatus: ValidateEmailFeedback,
  ) {
    this.#emailValidationStatus = emailValidationStatus;
  }

  public async validateEmail(email: string): Promise<ValidateEmailFeedback> {
    if (this.#emailValidationStatus) return this.#emailValidationStatus;
    if (email.includes("@donotexist"))
      return {
        status: "invalid_domain",
        proposal: null,
      };
    if (email.includes("donotexist@"))
      return {
        status: "invalid_email",
        proposal: null,
      };
    if (email.includes("error@"))
      return {
        status: "unexpected_error",
        proposal: null,
      };
    if (email === "email-with-typo@gamil.com")
      return {
        status: "rejected_email",
        proposal: "email-with-typo@gmail.com",
      };
    return {
      status: "accepted_email",
      proposal: null,
    };
  }
}
