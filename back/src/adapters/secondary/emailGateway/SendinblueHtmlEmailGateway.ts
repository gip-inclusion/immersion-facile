import type { AxiosInstance } from "axios";
import { generateHtmlFromTemplate, GenerateHtmlOptions } from "html-templates";
import { TemplatedEmail } from "shared";
import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import { createLogger } from "../../../utils/logger";
import { BadRequestError } from "../../primary/helpers/httpErrors";

export type EmailSentDto = {
  templatedEmail: TemplatedEmail;
  sentAt: string;
  error?: string;
};

const logger = createLogger(__filename);

type RecipientOrSender = {
  name?: string;
  email: string;
};

export type HtmlEmailData = {
  to: RecipientOrSender[];
  cc?: RecipientOrSender[];
  htmlContent: string;
  sender: RecipientOrSender;
  subject: string;
  tags?: string[];
};

export class SendinblueHtmlEmailGateway implements EmailGateway {
  constructor(
    private axiosInstance: AxiosInstance,
    private emailAllowListPredicate: (recipient: string) => boolean,
    private apiKey: string,
    private sender: RecipientOrSender,
    private generateHtmlOptions: GenerateHtmlOptions = {},
  ) {}

  public getLastSentEmailDtos(): EmailSentDto[] {
    throw new BadRequestError(
      "It is not possible de get last sent mails from SendInBlue email gateway",
    );
  }

  private filterAllowListAndConvertToRecipients(
    emails: string[] = [],
  ): RecipientOrSender[] {
    return emails
      .filter(this.emailAllowListPredicate)
      .map((email) => ({ email }));
  }

  public async sendEmail(email: TemplatedEmail) {
    if (email.recipients.length === 0) {
      logger.error({ email }, "No recipient for provided email");
      throw new BadRequestError("No recipient for provided email");
    }
    const cc = this.filterAllowListAndConvertToRecipients(email.cc);

    const emailData: HtmlEmailData = {
      to: this.filterAllowListAndConvertToRecipients(email.recipients),
      ...(cc.length ? { cc } : {}),
      ...generateHtmlFromTemplate(
        email.type,
        email.params,
        this.generateHtmlOptions,
      ),
      sender: this.sender,
    };

    if (emailData.to.length === 0) return;

    logger.info({ emailData }, "Sending email");

    const data = await this.sendTransacEmail(emailData);

    logger.info(data, "Email sending succeeded");
  }

  public async sendTransacEmail(emailData: HtmlEmailData) {
    const headers = {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": this.apiKey,
    };

    await this.axiosInstance.post(
      "https://api.sendinblue.com/v3/smtp/email",
      emailData,
      { headers },
    );
  }
}
