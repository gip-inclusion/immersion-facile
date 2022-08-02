import { Observable, Subject } from "rxjs";
import { EmailSentDto } from "shared/src/email/email";
import { AdminToken } from "shared/src/admin/admin.dto";
import { SentEmailGateway } from "src/core-logic/ports/SentEmailGateway";

export class TestSentEmailGateway implements SentEmailGateway {
  getLatest(_: AdminToken): Observable<EmailSentDto[]> {
    return this.sentEmails$;
  }

  public sentEmails$ = new Subject<EmailSentDto[]>();
}
