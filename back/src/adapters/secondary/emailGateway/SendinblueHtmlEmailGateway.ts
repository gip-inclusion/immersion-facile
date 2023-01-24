import type { AxiosInstance } from "axios";
import {
  configureGenerateHtmlFromTemplate,
  GenerateHtmlOptions,
} from "html-templates";
import {
  cciCustomHtmlFooter,
  cciCustomHtmlHeader,
} from "html-templates/src/components/email";
import promClient from "prom-client";
import {
  immersionFacileContactEmail,
  TemplatedEmail,
  templatesByName,
} from "shared";
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
  attachment?: { url: string }[];
};

export class SendinblueHtmlEmailGateway implements EmailGateway {
  constructor(
    private axiosInstance: AxiosInstance,
    private emailAllowListPredicate: (recipient: string) => boolean,
    private apiKey: string,
    private sender: RecipientOrSender,
    private generateHtmlOptions: GenerateHtmlOptions = {},
  ) {}

  public async sendEmail(email: TemplatedEmail) {
    if (email.recipients.length === 0) {
      logger.error({ email }, "No recipient for provided email");
      throw new BadRequestError("No recipient for provided email");
    }
    const cc = this.filterAllowListAndConvertToRecipients(email.cc);

    const emailData: HtmlEmailData = {
      to: this.filterAllowListAndConvertToRecipients(email.recipients),
      ...(cc.length ? { cc } : {}),
      ...configureGenerateHtmlFromTemplate(
        templatesByName,
        {
          contactEmail: immersionFacileContactEmail,
        },
        "internshipKind" in email.params &&
          email.params.internshipKind === "mini-stage-cci"
          ? {
              header: cciCustomHtmlHeader,
              footer: cciCustomHtmlFooter,
            }
          : { footer: undefined, header: undefined },
      )(email.type, email.params, this.generateHtmlOptions),
      sender: this.sender,
    };

    if (emailData.to.length === 0) return;

    const emailType = email.type;
    counterSendTransactEmailTotal.inc({ emailType });
    logger.info({ emailData }, "Sending email");

    return this.sendTransacEmail(emailData)
      .then((data) => {
        counterSendTransactEmailSuccess.inc({ emailType });
        logger.info(data, "Email sending succeeded");
      })
      .catch((error) => {
        counterSendTransactEmailError.inc({ emailType });
        logger.error(
          { errorMessage: error.message, errorBody: error?.response?.data },
          "Email sending failed",
        );
        throw error;
      });
  }

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

  private async sendTransacEmail(emailData: HtmlEmailData) {
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

const counterSendTransactEmailTotal = new promClient.Counter({
  name: "sendinblue_send_transac_email_total",
  help: "The total count of sendTransacEmail requests, broken down by email type.",
  labelNames: ["emailType"],
});

const counterSendTransactEmailSuccess = new promClient.Counter({
  name: "sendinblue_send_transac_email_success",
  help: "The success count of sendTransacEmail requests, broken down by email type.",
  labelNames: ["emailType"],
});

const counterSendTransactEmailError = new promClient.Counter({
  name: "sendinblue_send_transac_email_error",
  help: "The error count of sendTransacEmail requests, broken down by email type.",
  labelNames: ["emailType", "errorType"],
});
