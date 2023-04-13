import { Observable } from "rxjs";

import { Email, ValidateEmailStatus } from "shared";

export interface EmailValidationGateway {
  getEmailStatus(email: Email): Promise<ValidateEmailStatus>;
  getEmailStatus$(email: Email): Observable<ValidateEmailStatus>;
}
