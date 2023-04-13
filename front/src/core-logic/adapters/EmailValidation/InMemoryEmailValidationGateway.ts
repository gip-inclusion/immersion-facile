import { from, Observable } from "rxjs";
import { type Email, sleep, type ValidateEmailStatus } from "shared";
import { EmailValidationGateway } from "src/core-logic/ports/EmailValidationGateway";

export class InMemoryEmailValidationGateway implements EmailValidationGateway {
  constructor(private simulatedLatencyMs: number | undefined = undefined) {}

  public async getEmailStatus(email: Email): Promise<ValidateEmailStatus> {
    if (this.simulatedLatencyMs) await sleep(this.simulatedLatencyMs);
    const emailWithErrorStatus: ValidateEmailStatus = {
      isValid: false,
      proposal: "",
      reason: "invalid_email",
    };
    const emailWithTypoStatus: ValidateEmailStatus = {
      isValid: false,
      proposal: "email-with-typo@gmail.com",
      reason: "invalid_email",
    };
    if (email === "email-with-error@example.com") return emailWithErrorStatus;
    if (email === "email-with-typo@gamil.com") return emailWithTypoStatus;
    return {
      isValid: true,
      reason: "accepted_email",
      proposal: null,
    };
  }
  public getEmailStatus$(query: Email): Observable<ValidateEmailStatus> {
    return from(this.getEmailStatus(query));
  }
}
