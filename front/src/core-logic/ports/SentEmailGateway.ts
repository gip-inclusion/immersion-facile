import { EmailSentDto } from "shared/email";
import { AdminToken } from "shared/src/admin/admin.dto";

export interface SentEmailGateway {
  getLatest(adminToken: AdminToken): Promise<EmailSentDto[]>;
}
