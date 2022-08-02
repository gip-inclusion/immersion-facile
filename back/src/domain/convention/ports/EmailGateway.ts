import { EmailSentDto, TemplatedEmail } from "shared/src/email/email";

export interface EmailGateway {
  getLastSentEmailDtos: () => EmailSentDto[];
  sendEmail: (templatedEmail: TemplatedEmail) => Promise<void>;
}
