import { Observable, Subject } from "rxjs";
import { EmailSentDto } from "shared";
import { AdminToken } from "shared";
import { SentEmailGateway } from "src/core-logic/ports/SentEmailGateway";

export class TestSentEmailGateway implements SentEmailGateway {
  getLatest(_: AdminToken): Observable<EmailSentDto[]> {
    return this.sentEmails$;
  }

  public sentEmails$ = new Subject<EmailSentDto[]>();
}
