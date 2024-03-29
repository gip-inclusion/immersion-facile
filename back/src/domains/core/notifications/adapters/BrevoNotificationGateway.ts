import Bottleneck from "bottleneck";
import {
  GenerateHtmlOptions,
  configureGenerateHtmlFromTemplate,
} from "html-templates";
import {
  cciCustomHtmlFooter,
  cciCustomHtmlHeader,
} from "html-templates/src/components/email";
import {
  NotificationId,
  type TemplatedEmail,
  type TemplatedSms,
  emailTemplatesByName,
  smsTemplatesByName,
} from "shared";
import { HttpClient } from "shared-routes";
import { BadRequestError } from "../../../../config/helpers/httpErrors";
import {
  counterSendTransactEmailError,
  counterSendTransactEmailSuccess,
  counterSendTransactEmailTotal,
} from "../../../../utils/counters";
import { createLogger } from "../../../../utils/logger";
import { NotificationGateway } from "../ports/NotificationGateway";
import { BrevoNotificationGatewayRoutes } from "./BrevoNotificationGateway.routes";
import {
  ApiKey,
  BrevoHeaders,
  RecipientOrSender,
  SendTransactEmailRequestBody,
  SendTransactSmsRequestBody,
} from "./BrevoNotificationGateway.schemas";

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
    private readonly config: {
      httpClient: HttpClient<BrevoNotificationGatewayRoutes>;
      emailAllowListPredicate: (recipient: string) => boolean;
      defaultSender: RecipientOrSender;
      blackListedEmailDomains: string[];
      generateHtmlOptions?: GenerateHtmlOptions;
    },
    apiKey: ApiKey,
  ) {
    this.#brevoHeaders = {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    };
  }

  public async getAttachmentContent(downloadToken: string): Promise<Buffer> {
    const response = await this.config.httpClient.getAttachmentContent({
      urlParams: { downloadToken },
      headers: {
        accept: "application/octet-stream",
        "api-key": this.#brevoHeaders["api-key"],
      },
    });
    return response.body;
  }

  public async sendEmail(
    email: TemplatedEmail,
    notificationId?: NotificationId,
  ) {
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
        "internshipKind" in email.params &&
          email.params.internshipKind === "mini-stage-cci"
          ? {
              header: cciCustomHtmlHeader,
              footer: cciCustomHtmlFooter,
            }
          : { footer: undefined, header: undefined },
      )(email.kind, email.params, this.config.generateHtmlOptions),
      sender: email.sender ?? this.config.defaultSender,
    };

    if (emailData.to.length === 0) return;

    const emailType = email.kind;
    counterSendTransactEmailTotal.inc({ emailType });
    logger.info(
      {
        to: emailData.to,
        type: email.kind,
        subject: emailData.subject ?? "Sans objet",
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
            errorMessage: error?.response?.data ?? error?.message,
            notificationId,
            notificationKind: "email",
          },
          "sendTransactEmailError",
        );
        throw error;
      });
  }

  public sendSms(
    { kind, params, recipientPhone }: TemplatedSms,
    notificationId?: NotificationId,
  ): Promise<void> {
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
            notificationId,
            notificationKind: "sms",
            error,
          },
          "sendTransactSmsError",
        );
        throw error;
      });
  }

  async #sendTransacEmail(body: SendTransactEmailRequestBody) {
    return this.#emailLimiter.schedule(() =>
      this.config.httpClient.sendTransactEmail({
        headers: this.#brevoHeaders,
        body,
      }),
    );
  }

  #sendTransacSms(body: SendTransactSmsRequestBody) {
    return this.#smslimiter.schedule(() =>
      this.config.httpClient.sendTransactSms({
        headers: this.#brevoHeaders,
        body,
      }),
    );
  }

  #filterAllowListAndConvertToRecipients(
    emails: string[] = [],
  ): RecipientOrSender[] {
    return emails
      .filter(this.config.emailAllowListPredicate)
      .filter(
        filterBlackListedEmailDomains(this.config.blackListedEmailDomains),
      )
      .map((email) => ({ email }));
  }
}

const filterBlackListedEmailDomains =
  (blackListedEmailDomains: string[]) => (email: string) =>
    !blackListedEmailDomains.some((domain) =>
      email.toLowerCase().endsWith(domain.toLowerCase()),
    );
