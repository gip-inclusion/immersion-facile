import { Observable } from "rxjs";
import { AdminToken, EmailSentDto } from "shared";

export interface SentEmailGateway {
  getLatest(adminToken: AdminToken): Observable<EmailSentDto[]>;
}
