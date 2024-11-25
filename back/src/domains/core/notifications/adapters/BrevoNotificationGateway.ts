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
  errors,
  smsTemplatesByName,
} from "shared";
import { HttpClient } from "shared-routes";
import { ApiKey, BrevoHeaders } from "../../../../utils/apiBrevoUrl";
import {
  counterSendTransactEmailError,
  counterSendTransactEmailSuccess,
  counterSendTransactEmailTotal,
} from "../../../../utils/counters";
import { createLogger } from "../../../../utils/logger";
import { Base64, NotificationGateway } from "../ports/NotificationGateway";
import { BrevoNotificationGatewayRoutes } from "./BrevoNotificationGateway.routes";
import {
  RecipientOrSender,
  SendTransactEmailRequestBody,
  SendTransactSmsRequestBody,
} from "./BrevoNotificationGateway.schemas";

const logger = createLogger(__filename);

// to keep align with Brevo Entreprise API limits : https://developers.brevo.com/docs/api-limits#enterprise-rate-limiting

const brevoMaxEmailRequestsPerSeconds = 2_000;
const brevoMaxSmsRequestsPerSeconds = 200;

const ONE_SECOND_MS = 1_000;

// documentation https://developers.brevo.com/reference/sendtransacemail
export class BrevoNotificationGateway implements NotificationGateway {
  readonly #brevoHeaders: BrevoHeaders;

  #emailLimiter = new Bottleneck({
    reservoir: brevoMaxEmailRequestsPerSeconds,
    reservoirRefreshInterval: ONE_SECOND_MS, // number of ms
    reservoirRefreshAmount: brevoMaxEmailRequestsPerSeconds,
  });

  #smslimiter = new Bottleneck({
    reservoir: brevoMaxSmsRequestsPerSeconds,
    reservoirRefreshInterval: ONE_SECOND_MS, // number of ms
    reservoirRefreshAmount: brevoMaxSmsRequestsPerSeconds,
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
      "Content-Type": "application/json",
      "api-key": apiKey,
    };
  }

  public async getAttachmentContent(downloadToken: string): Promise<Base64> {
    const response = await this.config.httpClient.getAttachmentContent({
      urlParams: { downloadToken },
      headers: {
        accept: "application/octet-stream",
        "api-key": this.#brevoHeaders["api-key"],
      },
    });
    if (response.status !== 200)
      throw new Error(
        `Unexpected status code ${response.status}. Body: ${JSON.stringify(
          response.body,
          null,
          2,
        )}`,
      );

    const blob: Blob = response.body;
    return Buffer.from(await blob.arrayBuffer()).toString("base64");
  }

  public async sendEmail(
    email: TemplatedEmail,
    notificationId?: NotificationId,
  ) {
    if (email.recipients.length === 0) {
      throw errors.notification.missingRecipient({ notificationId });
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
    logger.info({
      notificationId,
      message: "sendTransactEmailTotal",
    });

    return this.#sendTransacEmail(emailData)
      .then((_response) => {
        counterSendTransactEmailSuccess.inc({ emailType });
        logger.info({
          notificationId,
          message: "sendTransactEmailSuccess",
        });
      })
      .catch((error) => {
        counterSendTransactEmailError.inc({ emailType });
        logger.error({
          notificationId,
          message: "sendTransactEmailError",
        });
        throw error;
      });
  }

  public sendSms(
    { kind, params, recipientPhone }: TemplatedSms,
    notificationId?: NotificationId,
  ): Promise<void> {
    logger.info({
      notificationId,
      message: "sendTransactSmsTotal",
    });

    return this.#sendTransacSms({
      content: smsTemplatesByName[kind].createContent(params as any),
      sender: "ImmerFacile",
      recipient: recipientPhone,
    })
      .then((_response) =>
        logger.info({
          notificationId,
          message: "sendTransactSmsSuccess",
        }),
      )
      .catch((error) => {
        logger.error({
          notificationId,
          message: "sendTransactSmsError",
        });
        throw error;
      });
  }

  async #sendTransacEmail(body: SendTransactEmailRequestBody) {
    return this.#emailLimiter.schedule(async () => {
      const response = await this.config.httpClient.sendTransactEmail({
        headers: this.#brevoHeaders,
        body,
      });
      if (response.status !== 201) {
        throw new Error(
          `Unexpected status code ${response.status}, when sending email to Brevo. You can view details on datadog.`,
        );
      }
      return response;
    });
  }

  #sendTransacSms(body: SendTransactSmsRequestBody) {
    return this.#smslimiter.schedule(async () => {
      const response = await this.config.httpClient.sendTransactSms({
        headers: this.#brevoHeaders,
        body,
      });
      if (response.status !== 201) {
        throw new Error(
          `Unexpected status code ${response.status}, when sending SMS to Brevo. You can view details on datadog.`,
        );
      }
      return response;
    });
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
