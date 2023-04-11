import { from, Observable } from "rxjs";
import {
  EmailValidationQueryInput,
  EmailValidationStatus,
  sleep,
} from "shared";
import { EmailValidationGateway } from "src/core-logic/ports/EmailValidationGateway";

export class InMemoryEmailValidationGateway implements EmailValidationGateway {
  constructor(private simulatedLatencyMs: number | undefined = undefined) {}

  public async getEmailStatus(
    email: EmailValidationQueryInput,
  ): Promise<EmailValidationStatus> {
    if (this.simulatedLatencyMs) await sleep(this.simulatedLatencyMs);
    const emailWithErrorStatus: EmailValidationStatus = {
      isFree: false,
      isValid: false,
      proposal: "",
      reason: "invalid_email",
    };
    const emailWithTypoStatus: EmailValidationStatus = {
      isFree: false,
      isValid: false,
      proposal: "email-with-typo@gmail.com",
      reason: "invalid_email",
    };
    if (email === "email-with-error@example.com") return emailWithErrorStatus;
    if (email === "email-with-typo@gamil.com") return emailWithTypoStatus;
    return {
      isFree: true,
      isValid: true,
      reason: "accepted_email",
      proposal: null,
    };
  }
  public getEmailStatus$(
    query: EmailValidationQueryInput,
  ): Observable<EmailValidationStatus> {
    return from(this.getEmailStatus(query));
  }
}
