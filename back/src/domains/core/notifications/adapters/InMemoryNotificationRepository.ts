import { parseISO } from "date-fns";
import {
  AgencyDto,
  AgencyWithUsersRights,
  ConventionDto,
  EmailNotification,
  Notification,
  NotificationId,
  NotificationKind,
  ShortLinkId,
  Signatory,
  SmsNotification,
  TemplatedEmail,
  concatValidatorNames,
  displayEmergencyContactInfos,
  expectToEqual,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { makeShortLinkUrl } from "../../short-link/ShortLink";
import {
  EmailNotificationFilters,
  NotificationRepository,
  SmsNotificationFilters,
} from "../ports/NotificationRepository";

export class InMemoryNotificationRepository implements NotificationRepository {
  // for tests purposes
  public notifications: Notification[] = [];

  async getLastSmsNotificationByFilter(
    filters: SmsNotificationFilters,
  ): Promise<SmsNotification | undefined> {
    return this.notifications.find(
      (notification): notification is SmsNotification => {
        if (notification.kind !== "sms") return false;

        if (
          filters.recipientPhoneNumber !==
          notification.templatedContent.recipientPhone
        )
          return false;

        if (filters.smsKind !== notification.templatedContent.kind)
          return false;

        return filters.conventionId === notification.followedIds.conventionId;
      },
    );
  }

  async getSmsByIds(ids: NotificationId[]): Promise<SmsNotification[]> {
    return getNotificationsMatchingKindAndIds("sms", this.notifications, ids);
  }

  async getEmailsByIds(ids: NotificationId[]): Promise<EmailNotification[]> {
    return getNotificationsMatchingKindAndIds("email", this.notifications, ids);
  }

  public deleteAllEmailAttachements(): Promise<number> {
    throw new Error("Not implemented");
  }

  public async getByIdAndKind(
    id: NotificationId,
    kind: NotificationKind,
  ): Promise<Notification | undefined> {
    return getNotificationsMatchingKindAndIds(kind, this.notifications, [
      id,
    ])[0];
  }

  public async getLastEmailsByFilters(filters?: EmailNotificationFilters) {
    return this.notifications.filter(
      (notification): notification is EmailNotification => {
        if (notification.kind !== "email") return false;

        if (!filters) return true;

        const matchesRequiredFilters =
          notification.templatedContent.recipients.includes(filters.email) &&
          notification.templatedContent.kind === filters.emailType;

        if (!matchesRequiredFilters) return false;

        if (filters.conventionId !== undefined) {
          return notification.followedIds.conventionId === filters.conventionId;
        }

        return true;
      },
    );
  }

  public async getLastNotifications() {
    return {
      emails: await this.getLastEmailsByFilters(),
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

const getNotificationsMatchingKindAndIds = <K extends NotificationKind>(
  kind: K,
  notifications: Notification[],
  ids: NotificationId[],
): Extract<Notification, { kind: K }>[] =>
  notifications.filter(
    (notification) =>
      notification.kind === kind && ids.includes(notification.id),
  ) as Extract<Notification, { kind: K }>[];

export const expectEmailSignatoryConfirmationSignatureRequestMatchingConvention =
  ({
    templatedEmail,
    convention,
    signatory,
    recipient,
    agency,
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
    },
  });

export const expectNotifyConventionRejected = (
  templatedEmail: TemplatedEmail,
  recipients: string[],
  convention: ConventionDto,
  agency: AgencyWithUsersRights,
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
