import { Observable, Subject } from "rxjs";

import { BackOfficeJwt, EmailSentDto } from "shared";

import { SentEmailGateway } from "src/core-logic/ports/SentEmailGateway";

export class TestSentEmailGateway implements SentEmailGateway {
  getLatest(_: BackOfficeJwt): Observable<EmailSentDto[]> {
    return this.sentEmails$;
  }

  public sentEmails$ = new Subject<EmailSentDto[]>();
}
