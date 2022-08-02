import { Observable } from "rxjs";
import { EmailSentDto } from "shared/src/email/email";
import { AdminToken } from "shared/src/admin/admin.dto";

export interface SentEmailGateway {
  getLatest(adminToken: AdminToken): Observable<EmailSentDto[]>;
}
