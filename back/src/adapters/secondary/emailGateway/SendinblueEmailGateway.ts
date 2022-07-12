import promClient from "prom-client";
import { keys } from "ramda";
import { EmailSentDto, EmailType, TemplatedEmail } from "shared/email";
import {
  SendSmtpEmail,
  SendSmtpEmailCc,
  SendSmtpEmailTo,
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
} from "sib-api-v3-typescript";
import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import { createLogger } from "../../../utils/logger";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { BadRequestError } from "../../primary/helpers/httpErrors";

const logger = createLogger(__filename);

export class SendinblueEmailGateway implements EmailGateway {
  private constructor(
    private readonly apiInstance: TransactionalEmailsApi,
    private readonly emailAllowListPredicate: (recipient: string) => boolean,
  ) {}

  public static create(
    apiKey: string,
    emailAllowListPredicate: (recipient: string) => boolean,
    apiInstance: TransactionalEmailsApi = new TransactionalEmailsApi(),
  ): SendinblueEmailGateway {
    apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);

    return new SendinblueEmailGateway(apiInstance, emailAllowListPredicate);
  }

  public getLastSentEmailDtos(): EmailSentDto[] {
    throw new BadRequestError(
      "It is not possible de get last sent mails from SendInBlue email gateway",
    );
  }

  public async sendEmail(email: TemplatedEmail) {
    const { recipients, type: emailType } = email;
    const filteredRecipients = recipients
      .filter(this.emailAllowListPredicate)
      .map((email): SendSmtpEmailTo => ({ email }));
    if (filteredRecipients.length === 0) return;

    const filteredCarbonCopy: string[] = (email.cc ?? []).filter(
      this.emailAllowListPredicate,
    );

    const templateId = emailTypeToTemplateId[emailType];
    const baseEmailConfig: SendSmtpEmail = {
      templateId,
      to: filteredRecipients,
      params: convertToSendInBlueParams(email.params),
    };

    const fullEmailConfig = addCarbonCopyFieldIfNeeded(
      baseEmailConfig,
      filteredCarbonCopy,
    );

    try {
      counterSendTransactEmailTotal.inc({ emailType });
      logger.info({ fullEmailConfig }, "Sending email");

      const data = await this.apiInstance.sendTransacEmail(fullEmailConfig);

      counterSendTransactEmailSuccess.inc({ emailType });
      logger.info(data, "Email sending succeeded");
    } catch (error: any) {
      counterSendTransactEmailError.inc({ emailType });
      logger.error(error, "Email sending failed");
      notifyObjectDiscord({
        _message: `Email ${emailType} sending failed`,
        recipients: recipients.join("; "),
        body: JSON.stringify(error?.body, null, 2),
        response: JSON.stringify(
          {
            statusCode: error?.response?.statusCode,
            body: error?.response?.body,
          },
          null,
          2,
        ),
      });
      throw error;
    }
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

const emailTypeToTemplateId: Record<EmailType, number> = {
  // https://my.sendinblue.com/camp/template/10/message-setup
  // NEW_CONVENTION_ADMIN_NOTIFICATION: 10, // v2 -> not used any more

  // https://my.sendinblue.com/camp/template/27/message-setup
  NEW_CONVENTION_AGENCY_NOTIFICATION: 27,

  // https://my.sendinblue.com/camp/template/4/message-setup
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: 4, // v1

  // https://my.sendinblue.com/camp/template/5/message-setup
  NEW_CONVENTION_MENTOR_CONFIRMATION: 5, // v1

  // https://my.sendinblue.com/camp/template/6/message-setup
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: 6,

  // https://my.sendinblue.com/camp/template/9/message-setup
  REJECTED_CONVENTION_NOTIFICATION: 9,

  // https://my.sendinblue.com/camp/template/13/message-setup
  CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: 13,

  // https://my.sendinblue.com/camp/template/11/message-setup
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: 11,

  // https://my.sendinblue.com/camp/template/14/message-setup
  MAGIC_LINK_RENEWAL: 14,

  // https://my.sendinblue.com/camp/template/15/message-setup
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: 15,

  // https://my.sendinblue.com/camp/template/16/message-setup
  BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION: 16, // EXISTING_SIGNATURE_NAME, MISSING_SIGNATURE_NAME

  // https://my.sendinblue.com/camp/template/18/message-setup
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE: 18,

  // https://my.sendinblue.com/camp/template/19/message-setup
  NEW_CONVENTION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE: 19,

  // https://my.sendinblue.com/camp/template/20/message-setup
  CONTACT_BY_EMAIL_REQUEST: 20,

  // https://my.sendinblue.com/camp/template/21/message-setup
  CONTACT_BY_PHONE_INSTRUCTIONS: 21,

  // https://my.sendinblue.com/camp/template/22/message-setup
  CONTACT_IN_PERSON_INSTRUCTIONS: 22,

  // https://my.sendinblue.com/camp/template/24/message-setup
  SHARE_DRAFT_CONVENTION_BY_LINK: 24,

  // https://my.sendinblue.com/camp/template/25/message-setup
  EDIT_FORM_ESTABLISHMENT_LINK: 25,

  // https://my.sendinblue.com/camp/template/26/message-setup
  SUGGEST_EDIT_FORM_ESTABLISHMENT: 26,

  // https://my.sendinblue.com/camp/template/41/message-setup
  CREATE_IMMERSION_ASSESSMENT: 41,

  // https://my.sendinblue.com/camp/template/39/message-setup
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: 39,

  // https://my.sendinblue.com/camp/template/42/message-setup
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: 42,

  // https://my.sendinblue.com/camp/template/42/message-setup
  AGENCY_WAS_ACTIVATED: 48,
};

const addCarbonCopyFieldIfNeeded = (
  baseEmailConfig: SendSmtpEmail,
  carbonCopy: string[],
): SendSmtpEmail => {
  if (carbonCopy.length === 0) return baseEmailConfig;

  return {
    ...baseEmailConfig,
    cc: carbonCopy.map((email): SendSmtpEmailCc => ({ email })),
  };
};

const convertToSendInBlueParams = (params: TemplatedEmail["params"]) =>
  keys(params).reduce(
    (acc, key) => ({
      ...acc,
      [sendInBlueKeyByEmailVariables[key]]: params[key],
    }),
    {},
  );

type KeysOfUnion<T> = T extends T ? keyof T : never;
// https://stackoverflow.com/questions/49401866/all-possible-keys-of-an-union-type

type EmailVariables = KeysOfUnion<TemplatedEmail["params"]>;

// keys are from our domain, values are SendInBlue keys in the templates :
const sendInBlueKeyByEmailVariables: Record<EmailVariables, string> = {
  additionalDetails: "ADDITIONAL_DETAILS",
  advisorFirstName: "ADVISOR_FIRST_NAME",
  advisorLastName: "ADVISOR_LAST_NAME",
  agency: "AGENCY",
  agencyName: "AGENCY_NAME",
  beneficiaryEmail: "BENEFICIARY_EMAIL",
  beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
  beneficiaryLastName: "BENEFICIARY_LAST_NAME",
  businessAddress: "BUSINESS_ADDRESS",
  businessName: "BUSINESS_NAME",
  // businessName: "COMPANY_NAME",
  contactFirstName: "CONTACT_FIRSTNAME",
  contactLastName: "CONTACT_LASTNAME",
  contactPhone: "CONTACT_PHONE",
  conventionFormUrl: "APPLICATION_FORM_LINK",
  dateEnd: "DATE_END",
  dateStart: "DATE_START",
  demandeId: "DEMANDE_ID",
  editFrontUrl: "EDIT_FRONT_LINK",
  emergencyContact: "EMERGENCY_CONTACT",
  emergencyContactPhone: "EMERGENCY_CONTACT_PHONE",
  existingSignatureName: "EXISTING_SIGNATURE_NAME",
  firstName: "FIRST_NAME",
  immersionActivities: "IMMERSION_ACTIVITIES",
  immersionAddress: "IMMERSION_ADDRESS",
  immersionAppellation: "IMMERSION_PROFESSION",
  immersionAppellationLabel: "IMMERSION_PROFESSION",
  immersionAssessmentCreationLink: "IMMERSION_ASSESSMENT_CREATION_LINK",
  immersionProfession: "IMMERSION_PROFESSION",
  immersionSkills: "IMMERSION_SKILLS",
  individualProtection: "INDIVIDUAL_PROTECTION",
  jobLabel: "JOB_LABEL",
  lastName: "LAST_NAME",
  magicLink: "MAGIC_LINK",
  mentor: "MENTOR",
  mentorName: "MENTOR_NAME",
  message: "MESSAGE",
  possibleRoleAction: "POSSIBLE_ROLE_ACTION",
  potentialBeneficiaryEmail: "POTENTIAL_BENEFICIARY_EMAIL",
  potentialBeneficiaryFirstName: "POTENTIAL_BENEFICIARY_FIRSTNAME",
  potentialBeneficiaryLastName: "POTENTIAL_BENEFICIARY_LASTNAME",
  questionnaireUrl: "QUESTIONNAIRE_URL",
  reason: "REASON",
  rejectionReason: "REASON",
  sanitaryPrevention: "SANITARY_PREVENTION_DESCRIPTION",
  scheduleText: "SCHEDULE_LINES",
  signature: "SIGNATURE",
  totalHours: "TOTAL_HOURS",
  workConditions: "WORK_CONDITIONS",
};
