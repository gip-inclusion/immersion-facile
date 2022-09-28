import { EmailSentDto, TemplatedEmail } from "shared";

export interface EmailGateway {
  getLastSentEmailDtos: () => EmailSentDto[];
  sendEmail: (templatedEmail: TemplatedEmail) => Promise<void>;
}
