import { EmailSentDto, TemplatedEmail } from "shared/email";

export interface EmailGateway {
  getLastSentEmailDtos: () => EmailSentDto[];
  sendEmail: (templatedEmail: TemplatedEmail) => Promise<void>;
}
