import { Logger } from "pino";
import * as SibApiV3Sdk from "sib-api-v3-typescript";
import {
  Email,
  EmailGateway,
} from "../../domain/demandeImmersion/ports/EmailGateway";
import { logger } from "../../utils/logger";

export class SendinblueEmailGateway implements EmailGateway {
  private readonly logger: Logger = logger.child({
    logsource: "SendinblueEmailGateway",
  });

  private constructor(
    private readonly apiInstance: SibApiV3Sdk.TransactionalEmailsApi
  ) {}

  public static create(apiKey: string): SendinblueEmailGateway {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      apiKey
    );
    return new SendinblueEmailGateway(apiInstance);
  }

  public async send({ recipient, subject, textContent }: Email) {
    const sibEmail = new SibApiV3Sdk.SendSmtpEmail();
    sibEmail.sender = {
      name: "L'immersion facile",
      email: "nepasrepondre@immersionfacile.beta.gouv.fr",
    };
    sibEmail.to = [{ email: recipient }];
    sibEmail.subject = subject;
    sibEmail.textContent = textContent;

    this.logger.info(sibEmail, "Sending email");
    try {
      const data = await this.apiInstance.sendTransacEmail(sibEmail);
      this.logger.info(data, "Email sending succeeded");
    } catch (e) {
      this.logger.error(e, "Email sending failed");
    }
  }
}
