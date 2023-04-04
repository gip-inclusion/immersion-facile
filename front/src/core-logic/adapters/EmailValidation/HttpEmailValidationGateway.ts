import { HttpClient } from "http-client";
import { from, Observable } from "rxjs";
import {
  EmailValidationQueryInput,
  emailValidationResponseSchema,
  EmailValidationStatus,
  EmailValidationTargets,
} from "shared";
import { EmailValidationGateway } from "src/core-logic/ports/EmailValidationGateway";

export class HttpEmailValidationGateway implements EmailValidationGateway {
  constructor(
    private readonly httpClient: HttpClient<EmailValidationTargets>,
  ) {}

  public async getEmailStatus(
    email: EmailValidationQueryInput,
  ): Promise<EmailValidationStatus> {
    const response = await this.httpClient.getEmailStatus({
      queryParams: {
        email,
      },
    });
    return emailValidationResponseSchema.parse(response.responseBody);
  }

  public getEmailStatus$(
    email: EmailValidationQueryInput,
  ): Observable<EmailValidationStatus> {
    return from(this.getEmailStatus(email));
  }
}
