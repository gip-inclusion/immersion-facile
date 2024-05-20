import { parseISO } from "date-fns";
import {
  AgencyDto,
  ConventionDto,
  EmailNotification,
  Notification,
  NotificationId,
  NotificationKind,
  Signatory,
  SmsNotification,
  TemplatedEmail,
  concatValidatorNames,
  displayEmergencyContactInfos,
  expectToEqual,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { makeShortLinkUrl } from "../../short-link/ShortLink";
import { ShortLinkId } from "../../short-link/ports/ShortLinkQuery";
import {
  EmailNotificationFilters,
  NotificationRepository,
} from "../ports/NotificationRepository";

export class InMemoryNotificationRepository implements NotificationRepository {
  // for tests purposes
  public notifications: Notification[] = [];

  public deleteAllEmailAttachements(): Promise<number> {
    throw new Error("Not implemented");
  }

  public async getByIdAndKind(
    id: NotificationId,
    kind: NotificationKind,
  ): Promise<Notification | undefined> {
    return this.notifications
      .filter((notification) => notification.kind === kind)
      .find((notification) => notification.id === id);
  }

  public async getEmailsByFilters(filters: EmailNotificationFilters = {}) {
    return this.notifications.filter(
      (notification): notification is EmailNotification => {
        if (notification.kind !== "email") return false;

        if (
          filters.email &&
          !notification.templatedContent.recipients.includes(filters.email)
        )
          return false;

        if (
          filters.emailKind &&
          notification.templatedContent.kind !== filters.emailKind
        )
          return false;

        return filters.since
          ? new Date(notification.createdAt) > filters.since
          : true;
      },
    );
  }

  public async getLastNotifications() {
    return {
      emails: await this.getEmailsByFilters(),
      sms: this.notifications.filter(
        (notification): notification is SmsNotification =>
          notification.kind === "sms",
      ),
    };
  }

  public async save(notification: Notification): Promise<void> {
    this.notifications.push(notification);
  }

  public async saveBatch(notifications: Notification[]): Promise<void> {
    this.notifications.push(...notifications);
  }
}

export const expectEmailSignatoryConfirmationSignatureRequestMatchingConvention =
  ({
    templatedEmail,
    convention,
    signatory,
    recipient,
    agency,
    conventionStatusLinkId,
    conventionToSignLinkId,
    config,
  }: {
    config: AppConfig;
    templatedEmail: TemplatedEmail;
    convention: ConventionDto;
    signatory: Signatory;
    recipient: string;
    now: Date;
    agency: AgencyDto;
    conventionToSignLinkId: ShortLinkId;
    conventionStatusLinkId: ShortLinkId;
  }) => {
    const { businessName } = convention;
    const {
      beneficiary,
      establishmentRepresentative,
      beneficiaryRepresentative,
      beneficiaryCurrentEmployer,
    } = convention.signatories;

    expectToEqual(templatedEmail, {
      kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: [recipient],
      params: {
        conventionId: convention.id,
        internshipKind: convention.internshipKind,
        signatoryName: `${signatory.firstName} ${signatory.lastName}`,
        beneficiaryName: `${beneficiary.firstName} ${beneficiary.lastName}`,
        establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
        establishmentRepresentativeName: `${establishmentRepresentative.firstName} ${establishmentRepresentative.lastName}`,
        beneficiaryRepresentativeName:
          beneficiaryRepresentative &&
          `${beneficiaryRepresentative.firstName} ${beneficiaryRepresentative.lastName}`,
        beneficiaryCurrentEmployerName:
          beneficiaryCurrentEmployer &&
          `${beneficiaryCurrentEmployer.firstName} ${beneficiaryCurrentEmployer.lastName}`,
        conventionSignShortlink: makeShortLinkUrl(
          config,
          conventionToSignLinkId,
        ),
        conventionStatusLink: makeShortLinkUrl(config, conventionStatusLinkId),
        businessName,
        agencyLogoUrl: agency.logoUrl ?? undefined,
      },
    });
  };

export const expectEmailFinalValidationConfirmationMatchingConvention = (
  recipients: string[],
  templatedEmails: TemplatedEmail,
  agency: AgencyDto,
  convention: ConventionDto,
  config: AppConfig,
  conventionToSignLinkId: ShortLinkId,
) =>
  expectToEqual(templatedEmails, {
    kind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
    recipients,
    params: {
      conventionId: convention.id,
      internshipKind: convention.internshipKind,
      beneficiaryFirstName: convention.signatories.beneficiary.firstName,
      beneficiaryLastName: convention.signatories.beneficiary.lastName,
      beneficiaryBirthdate: convention.signatories.beneficiary.birthdate,
      dateStart: parseISO(convention.dateStart).toLocaleDateString("fr"),
      dateEnd: parseISO(convention.dateEnd).toLocaleDateString("fr"),
      establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
      businessName: convention.businessName,
      immersionAppellationLabel:
        convention.immersionAppellation.appellationLabel,
      emergencyContactInfos: displayEmergencyContactInfos({
        beneficiaryRepresentative:
          convention.signatories.beneficiaryRepresentative,
        beneficiary: convention.signatories.beneficiary,
      }),
      agencyLogoUrl: agency.logoUrl ?? undefined,
      magicLink: makeShortLinkUrl(config, conventionToSignLinkId),
      validatorName: convention.validators?.agencyValidator
        ? concatValidatorNames(convention.validators?.agencyValidator)
        : "",
      agencyAssessmentDocumentLink: agency.questionnaireUrl ?? undefined,
      agencyReferentEmail: agency.refersToAgencyId
        ? agency.counsellorEmails[0]
        : agency.validatorEmails[0],
    },
  });

export const expectNotifyConventionRejected = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  convention: ConventionDto,
  agency: AgencyDto,
) => {
  expectToEqual(templatedEmail, {
    kind: "REJECTED_CONVENTION_NOTIFICATION",
    recipients,
    params: {
      agencyName: agency.name,
      conventionId: convention.id,
      internshipKind: convention.internshipKind,
      beneficiaryFirstName: convention.signatories.beneficiary.firstName,
      beneficiaryLastName: convention.signatories.beneficiary.lastName,
      businessName: convention.businessName,
      rejectionReason: convention.statusJustification || "",
      signature: agency.signature,
      immersionProfession: convention.immersionAppellation.appellationLabel,
      agencyLogoUrl: agency.logoUrl ?? undefined,
    },
  });
};

export const expectNotifyConventionCancelled = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  convention: ConventionDto,
  agency: AgencyDto,
) => {
  expectToEqual(templatedEmail, {
    kind: "CANCELLED_CONVENTION_NOTIFICATION",
    recipients,
    params: {
      agencyName: agency.name,
      conventionId: convention.id,
      internshipKind: convention.internshipKind,
      beneficiaryFirstName: convention.signatories.beneficiary.firstName,
      beneficiaryLastName: convention.signatories.beneficiary.lastName,
      businessName: convention.businessName,
      signature: agency.signature,
      immersionProfession: convention.immersionAppellation.appellationLabel,
      agencyLogoUrl: agency.logoUrl ?? undefined,
      dateStart: convention.dateStart,
      dateEnd: convention.dateEnd,
      justification: convention.statusJustification || "non renseigné",
    },
  });
};

export const expectNotifyConventionIsDeprecated = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  convention: ConventionDto,
) => {
  expectToEqual(templatedEmail, {
    kind: "DEPRECATED_CONVENTION_NOTIFICATION",
    recipients,
    params: {
      conventionId: convention.id,
      internshipKind: convention.internshipKind,
      beneficiaryFirstName: convention.signatories.beneficiary.firstName,
      beneficiaryLastName: convention.signatories.beneficiary.lastName,
      businessName: convention.businessName,
      deprecationReason: convention.statusJustification || "",
      immersionProfession: convention.immersionAppellation.appellationLabel,
      dateEnd: convention.dateEnd,
      dateStart: convention.dateStart,
    },
  });
};
