import { Observable } from "rxjs";
import { EmailValidationStatus } from "shared";

export interface EmailValidationGateway {
  getEmailStatus(email: string): Promise<EmailValidationStatus>;
  getEmailStatus$(email: string): Observable<EmailValidationStatus>;
}
