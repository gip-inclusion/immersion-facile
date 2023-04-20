import {
  EmailSentDto,
  immersionFacileContactEmail,
  TemplatedEmail,
  templatesByName,
} from "shared";
import {
  configureGenerateHtmlFromTemplate,
  GenerateHtmlOptions,
} from "html-templates";
import {
  cciCustomHtmlFooter,
  cciCustomHtmlHeader,
} from "html-templates/src/components/email";
import { HttpClient } from "http-client";
import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import {
  counterSendTransactEmailError,
  counterSendTransactEmailSuccess,
  counterSendTransactEmailTotal,
} from "../../../utils/counters";
import { createLogger } from "../../../utils/logger";
import { BadRequestError } from "../../primary/helpers/httpErrors";
import {
  ApiKey,
  RecipientOrSender,
  SendTransactEmailRequestBody,
} from "./SendinblueHtmlEmailGateway.schemas";
import { SendinblueHtmlEmailGatewayTargets } from "./SendinblueHtmlEmailGateway.targets";

const logger = createLogger(__filename);

export class SendinblueHtmlEmailGateway implements EmailGateway {
  constructor(
    private readonly httpClient: HttpClient<SendinblueHtmlEmailGatewayTargets>,
    private emailAllowListPredicate: (recipient: string) => boolean,
    private apiKey: ApiKey,
    private sender: RecipientOrSender,
    private generateHtmlOptions: GenerateHtmlOptions = {},
  ) {}

  public async sendEmail(email: TemplatedEmail) {
    if (email.recipients.length === 0) {
      logger.error(
        { emailType: email.type, emailParams: email.params },
        "No recipient for provided email",
      );
      throw new BadRequestError("No recipient for provided email");
    }
    const cc = this.filterAllowListAndConvertToRecipients(email.cc);

    const emailData: SendTransactEmailRequestBody = {
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
    logger.info(
      {
        to: emailData.to,
        type: email.type,
        subject: emailData.subject,
        cc: emailData.cc,
        params: email.params,
      },
      "sendTransactEmailTotal",
    );

    return this.sendTransacEmail(emailData)
      .then(() => {
        counterSendTransactEmailSuccess.inc({ emailType });
        logger.info(
          { to: emailData.to, type: email.type },
          "sendTransactEmailSuccess",
        );
      })
      .catch((error) => {
        counterSendTransactEmailError.inc({ emailType });
        logger.error(
          {
            to: emailData.to,
            type: email.type,
            errorMessage: error.message,
            errorBody: error?.response?.data,
          },
          "sendTransactEmailError",
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

  private async sendTransacEmail(body: SendTransactEmailRequestBody) {
    await this.httpClient.sendTransactEmail({
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": this.apiKey,
      },
      body,
    });
  }
}
