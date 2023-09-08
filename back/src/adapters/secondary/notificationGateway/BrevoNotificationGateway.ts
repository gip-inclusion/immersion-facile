import Bottleneck from "bottleneck";
import {
  emailTemplatesByName,
  immersionFacileContactEmail,
  smsTemplatesByName,
  type TemplatedEmail,
  type TemplatedSms,
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
import { NotificationGateway } from "../../../domain/generic/notifications/ports/NotificationGateway";
import {
  counterSendTransactEmailError,
  counterSendTransactEmailSuccess,
  counterSendTransactEmailTotal,
} from "../../../utils/counters";
import { createLogger } from "../../../utils/logger";
import { BadRequestError } from "../../primary/helpers/httpErrors";
import {
  ApiKey,
  BrevoHeaders,
  RecipientOrSender,
  SendTransactEmailRequestBody,
  SendTransactSmsRequestBody,
} from "./BrevoNotificationGateway.schemas";
import { BrevoNotificationGatewayTargets } from "./BrevoNotificationGateway.targets";

const logger = createLogger(__filename);

const brevoMaxEmailRequestsPerSeconds = 2_000;
const brevoMaxSmsRequestsPerHours = 200;

const ONE_SECOND_MS = 1_000;
const ONE_HOUR_MS = ONE_SECOND_MS * 3_600;

// documentation https://developers.brevo.com/reference/sendtransacemail
export class BrevoNotificationGateway implements NotificationGateway {
  readonly #brevoHeaders: BrevoHeaders;

  #emailLimiter = new Bottleneck({
    reservoir: brevoMaxEmailRequestsPerSeconds,
    reservoirRefreshInterval: ONE_SECOND_MS, // number of ms
    reservoirRefreshAmount: brevoMaxEmailRequestsPerSeconds,
  });

  #smslimiter = new Bottleneck({
    reservoir: brevoMaxSmsRequestsPerHours,
    reservoirRefreshInterval: ONE_HOUR_MS, // number of ms
    reservoirRefreshAmount: brevoMaxSmsRequestsPerHours,
    minTime: 1000,
    maxConcurrent: 1,
  });

  constructor(
    private readonly httpClient: HttpClient<BrevoNotificationGatewayTargets>,
    private emailAllowListPredicate: (recipient: string) => boolean,
    apiKey: ApiKey,
    private defaultSender: RecipientOrSender,
    private generateHtmlOptions: GenerateHtmlOptions = {},
  ) {
    this.#brevoHeaders = {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    };
  }

  public async getAttachmentContent(downloadToken: string): Promise<Buffer> {
    const response = await this.httpClient.getAttachmentContent({
      urlParams: { downloadToken },
      headers: {
        accept: "application/octet-stream",
        "api-key": this.#brevoHeaders["api-key"],
      },
    });
    return response.responseBody;
  }

  public async sendEmail(email: TemplatedEmail) {
    if (email.recipients.length === 0) {
      logger.error(
        { emailType: email.kind, emailParams: email.params },
        "No recipient for provided email",
      );
      throw new BadRequestError("No recipient for provided email");
    }
    const cc = this.#filterAllowListAndConvertToRecipients(email.cc);

    const emailData: SendTransactEmailRequestBody = {
      to: this.#filterAllowListAndConvertToRecipients(email.recipients),
      ...(email.replyTo ? { replyTo: email.replyTo } : {}),
      ...(cc.length ? { cc } : {}),
      ...(email.attachments ? { attachment: email.attachments } : {}),
      ...configureGenerateHtmlFromTemplate(
        emailTemplatesByName,
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
      )(email.kind, email.params, this.generateHtmlOptions),
      sender: email.sender ?? this.defaultSender,
    };

    if (emailData.to.length === 0) return;

    const emailType = email.kind;
    counterSendTransactEmailTotal.inc({ emailType });
    logger.info(
      {
        to: emailData.to,
        type: email.kind,
        subject: emailData.subject,
        cc: emailData.cc,
        params: email.params,
      },
      "sendTransactEmailTotal",
    );

    return this.#sendTransacEmail(emailData)
      .then((_response) => {
        counterSendTransactEmailSuccess.inc({ emailType });
        logger.info(
          { to: emailData.to, type: email.kind },
          "sendTransactEmailSuccess",
        );
      })
      .catch((error) => {
        counterSendTransactEmailError.inc({ emailType });
        logger.error(
          {
            to: emailData.to,
            type: email.kind,
            errorMessage: error.message,
            errorBody: error?.response?.data,
          },
          "sendTransactEmailError",
        );
        throw error;
      });
  }

  public sendSms({
    kind,
    params,
    recipientPhone,
  }: TemplatedSms): Promise<void> {
    logger.info(
      {
        phone: recipientPhone,
      },
      "sendTransactSmsTotal",
    );

    return this.#sendTransacSms({
      content: smsTemplatesByName[kind].createContent(params as any),
      sender: "ImmerFacile",
      recipient: recipientPhone,
    })
      .then((_response) =>
        logger.info(
          {
            phone: recipientPhone,
          },
          "sendTransactSmsSuccess",
        ),
      )
      .catch((error) => {
        logger.error(
          {
            phone: recipientPhone,
            error,
          },
          "sendTransactSmsError",
        );
        throw error;
      });
  }

  async #sendTransacEmail(body: SendTransactEmailRequestBody) {
    return this.#emailLimiter.schedule(() =>
      this.httpClient.sendTransactEmail({
        headers: this.#brevoHeaders,
        body,
      }),
    );
  }

  #sendTransacSms(body: SendTransactSmsRequestBody) {
    return this.#smslimiter.schedule(() =>
      this.httpClient.sendTransactSms({
        headers: this.#brevoHeaders,
        body,
      }),
    );
  }

  #filterAllowListAndConvertToRecipients(
    emails: string[] = [],
  ): RecipientOrSender[] {
    return emails
      .filter(this.emailAllowListPredicate)
      .map((email) => ({ email }));
  }
}
