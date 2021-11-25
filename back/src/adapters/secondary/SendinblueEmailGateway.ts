import promClient from "prom-client";
import * as SibApiV3Sdk from "sib-api-v3-typescript";
import type {
  EmailType,
  NewApplicationAdminNotificationParams,
  NewApplicationBeneficiaryConfirmationParams,
  NewApplicationMentorConfirmationParams,
  NewImmersionApplicationReviewForEligibilityOrValidationParams,
  RejectedApplicationNotificationParams,
  ValidatedApplicationFinalConfirmationParams,
} from "../../domain/immersionApplication/ports/EmailGateway";
import { EmailGateway } from "../../domain/immersionApplication/ports/EmailGateway";
import { FormEstablishmentDto } from "../../shared/FormEstablishmentDto";
import {
  ModificationRequestApplicationNotificationParams,
  SendRenewedMagicLinkParams,
} from "./../../domain/immersionApplication/ports/EmailGateway";
import { createLogger } from "./../../utils/logger";

const logger = createLogger(__filename);

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

const emailTypeToTemplateId: Record<EmailType, number> = {
  // https://my.sendinblue.com/camp/template/10/message-setup
  NEW_APPLICATION_ADMIN_NOTIFICATION: 10, // v2

  // https://my.sendinblue.com/camp/template/4/message-setup
  NEW_APPLICATION_BENEFICIARY_CONFIRMATION: 4, // v1

  // https://my.sendinblue.com/camp/template/5/message-setup
  NEW_APPLICATION_MENTOR_CONFIRMATION: 5, // v1

  // https://my.sendinblue.com/camp/template/6/message-setup
  VALIDATED_APPLICATION_FINAL_CONFIRMATION: 6,

  // https://my.sendinblue.com/camp/template/9/message-setup
  REJECTED_APPLICATION_NOTIFICATION: 9,

  // https://my.sendinblue.com/camp/template/13/message-setup
  MODIFICATION_REQUEST_APPLICATION_NOTIFICATION: 13,

  // https://my.sendinblue.com/camp/template/11/message-setup
  NEW_APPLICATION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: 11,

  // https://my.sendinblue.com/camp/template/14/message-setup
  MAGIC_LINK_RENEWAL: 14,
  // https://my.sendinblue.com/camp/template/15/message-setup
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: 15,
};

export class SendinblueEmailGateway implements EmailGateway {
  private constructor(
    private readonly apiInstance: SibApiV3Sdk.TransactionalEmailsApi,
  ) {}

  public static create(apiKey: string): SendinblueEmailGateway {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      apiKey,
    );
    return new SendinblueEmailGateway(apiInstance);
  }

  public async sendNewEstablismentContactConfirmation(
    recipient: string,
    formEstablishmentDto: FormEstablishmentDto,
  ): Promise<void> {
    this.sendTransacEmail(
      "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
      [recipient],
      {
        CONTACT_FIRST_NAME: formEstablishmentDto.businessContacts[0].firstName,
        CONTACT_LAST_NAME: formEstablishmentDto.businessContacts[0].lastName,
        BUSINESS_NAME: formEstablishmentDto.businessName,
      },
    );
  }
  public async sendNewApplicationBeneficiaryConfirmation(
    recipient: string,
    params: NewApplicationBeneficiaryConfirmationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "NEW_APPLICATION_BENEFICIARY_CONFIRMATION",
      [recipient],
      {
        DEMANDE_ID: params.demandeId,
        FIRST_NAME: params.firstName,
        LAST_NAME: params.lastName,
      },
    );
  }

  public async sendNewApplicationMentorConfirmation(
    recipient: string,
    params: NewApplicationMentorConfirmationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "NEW_APPLICATION_MENTOR_CONFIRMATION",
      [recipient],
      {
        DEMANDE_ID: params.demandeId,
        MENTOR_NAME: params.mentorName,
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
      },
    );
  }

  public async sendNewApplicationAdminNotification(
    recipients: string[],
    params: NewApplicationAdminNotificationParams,
  ) {
    await this.sendTransacEmail(
      "NEW_APPLICATION_ADMIN_NOTIFICATION",
      recipients,
      {
        DEMANDE_ID: params.demandeId,
        FIRST_NAME: params.firstName,
        LAST_NAME: params.lastName,
        DATE_START: params.dateStart,
        DATE_END: params.dateEnd,
        BUSINESS_NAME: params.businessName,
        AGENCY_NAME: params.agencyName,
        MAGIC_LINK: params.magicLink,
      },
    );
  }

  public async sendValidatedApplicationFinalConfirmation(
    recipients: string[],
    params: ValidatedApplicationFinalConfirmationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "VALIDATED_APPLICATION_FINAL_CONFIRMATION",
      recipients,
      {
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
        DATE_START: params.dateStart,
        DATE_END: params.dateEnd,
        MENTOR_NAME: params.mentorName,
        SCHEDULE_LINES: params.scheduleText.split("\n"),
        BUSINESS_NAME: params.businessName,
        IMMERSION_ADDRESS: params.immersionAddress,
        IMMERSION_PROFESSION: params.immersionProfession,
        IMMERSION_ACTIVITIES: params.immersionActivities,
        SANITARY_PREVENTION_DESCRIPTION: params.sanitaryPrevention,
        INDIVIDUAL_PROTECTION: params.individualProtection,
        QUESTIONNAIRE_URL: params.questionnaireUrl,
        SIGNATURE: params.signature,
      },
    );
  }

  public async sendRejectedApplicationNotification(
    recipients: string[],
    params: RejectedApplicationNotificationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "REJECTED_APPLICATION_NOTIFICATION",
      recipients,
      {
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
        BUSINESS_NAME: params.businessName,
        REASON: params.rejectionReason,
        AGENCY: params.agency,
        SIGNATURE: params.signature,
      },
    );
  }

  public async sendModificationRequestApplicationNotification(
    recipients: string[],
    params: ModificationRequestApplicationNotificationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "MODIFICATION_REQUEST_APPLICATION_NOTIFICATION",
      recipients,
      {
        AGENCY: params.agency,
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
        BUSINESS_NAME: params.businessName,
        REASON: params.reason,
        SIGNATURE: params.signature,
        URL: params.magicLink,
      },
    );
  }

  public async sendNewApplicationForReviewNotification(
    recipients: string[],
    params: NewImmersionApplicationReviewForEligibilityOrValidationParams,
  ): Promise<void> {
    await this.sendTransacEmail(
      "NEW_APPLICATION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
      recipients,
      {
        BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
        BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
        BUSINESS_NAME: params.businessName,
        MAGIC_LINK: params.magicLink,
        POSSIBLE_ROLE_ACTION: params.possibleRoleAction,
      },
    );
  }

  public async sendRenewedMagicLink(
    recipients: string[],
    params: SendRenewedMagicLinkParams,
  ): Promise<void> {
    this.sendTransacEmail("MAGIC_LINK_RENEWAL", recipients, {
      MAGIC_LINK: params.magicLink,
    });
  }

  private async sendTransacEmail(
    emailType: EmailType,
    recipients: string[],
    params: any,
  ) {
    const sibEmail = new SibApiV3Sdk.SendSmtpEmail();
    sibEmail.templateId = emailTypeToTemplateId[emailType];
    sibEmail.to = recipients.map((email) => ({ email }));
    sibEmail.params = params;
    try {
      counterSendTransactEmailTotal.inc({ emailType });
      logger.info({ sibEmail }, "Sending email");

      const data = await this.apiInstance.sendTransacEmail(sibEmail);

      counterSendTransactEmailSuccess.inc({ emailType });
      logger.info(data, "Email sending succeeded");
    } catch (e: any) {
      counterSendTransactEmailError.inc({ emailType });
      logger.error(e, "Email sending failed");
    }
  }
}
