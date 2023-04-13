import { from, Observable } from "rxjs";
import {
  type Email,
  validateEmailResponseSchema,
  ValidateEmailStatus,
  ValidateEmailTargets,
} from "shared";
import { HttpClient } from "http-client";
import { EmailValidationGateway } from "src/core-logic/ports/EmailValidationGateway";

export class HttpEmailValidationGateway implements EmailValidationGateway {
  constructor(private readonly httpClient: HttpClient<ValidateEmailTargets>) {}

  public async getEmailStatus(email: Email): Promise<ValidateEmailStatus> {
    const response = await this.httpClient.validateEmail({
      queryParams: {
        email,
      },
    });
    return validateEmailResponseSchema.parse(response.responseBody);
  }

  public getEmailStatus$(email: Email): Observable<ValidateEmailStatus> {
    return from(this.getEmailStatus(email));
  }
}
