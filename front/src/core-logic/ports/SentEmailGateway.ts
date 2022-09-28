import { Observable } from "rxjs";
import { EmailSentDto } from "shared";
import { AdminToken } from "shared";

export interface SentEmailGateway {
  getLatest(adminToken: AdminToken): Observable<EmailSentDto[]>;
}
