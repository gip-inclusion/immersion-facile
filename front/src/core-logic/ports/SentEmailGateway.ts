import { Observable } from "rxjs";

import { BackOfficeJwt, EmailSentDto } from "shared";

export interface SentEmailGateway {
  getLatest(adminToken: BackOfficeJwt): Observable<EmailSentDto[]>;
}
