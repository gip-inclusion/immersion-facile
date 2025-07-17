import { addDays, parseISO } from "date-fns";
import {
  type AgencyDto,
  type AgencyWithUsersRights,
  type ConventionDto,
  displayEmergencyContactInfos,
  type EmailNotification,
  errors,
  expectToEqual,
  getFormattedFirstnameAndLastname,
  type Notification,
  type NotificationId,
  type NotificationKind,
  type NotificationState,
  replaceElementWhere,
  type ShortLinkId,
  type Signatory,
  type SmsNotification,
  type TemplatedEmail,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { makeShortLinkUrl } from "../../short-link/ShortLink";
import type {
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
    throw errors.generic.fakeError("Not implemented");
  }

  public async getByIdAndKind(
    id: NotificationId,
    kind: NotificationKind,
  ): Promise<Notification | undefined> {
    return getNotificationsMatchingKindAndIds(kind, this.notifications, [
      id,
    ])[0];
  }

  public async getEmailsByFilters(filters: EmailNotificationFilters) {
    return this.notifications.filter(
      (notification): notification is EmailNotification => {
        if (notification.kind !== "email") return false;

        if (
          filters.email &&
          !notification.templatedContent.recipients.includes(filters.email)
        )
          return false;

        if (
          filters.emailType &&
          notification.templatedContent.kind !== filters.emailType
        )
          return false;

        if (
          filters.conventionId &&
          notification.followedIds.conventionId !== filters.conventionId
        )
          return false;

        const startOfDay = filters.createdAt
          ? new Date(
              filters.createdAt.getFullYear(),
              filters.createdAt.getMonth(),
              filters.createdAt.getDate(),
            )
          : null;

        if (startOfDay) {
          return (
            new Date(notification.createdAt) > startOfDay &&
            new Date(notification.createdAt) < addDays(startOfDay, 1)
          );
        }

        return true;
      },
    );
  }

  public async getLastNotifications() {
    return {
      emails: this.notifications.filter(
        (notification): notification is EmailNotification =>
          notification.kind === "email",
      ),
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

  public async updateState(params: {
    notificationId: NotificationId;
    notificationKind: NotificationKind;
    state: NotificationState | undefined;
  }): Promise<void> {
    const notification = this.notifications.find(
      ({ id }) => id === params.notificationId,
    );
    if (!notification)
      throw new Error(
        `Notification ${params.notificationId} not found (In Memory Repository)`,
      );

    this.notifications = replaceElementWhere(
      this.notifications,
      { ...notification, state: params.state },
      ({ id }) => id === params.notificationId,
    );
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
        signatoryName: getFormattedFirstnameAndLastname({
          firstname: signatory.firstName,
          lastname: signatory.lastName,
        }),
        beneficiaryName: getFormattedFirstnameAndLastname({
          firstname: beneficiary.firstName,
          lastname: beneficiary.lastName,
        }),
        establishmentTutorName: getFormattedFirstnameAndLastname({
          firstname: convention.establishmentTutor.firstName,
          lastname: convention.establishmentTutor.lastName,
        }),
        establishmentRepresentativeName: getFormattedFirstnameAndLastname({
          firstname: establishmentRepresentative.firstName,
          lastname: establishmentRepresentative.lastName,
        }),
        beneficiaryRepresentativeName:
          beneficiaryRepresentative &&
          getFormattedFirstnameAndLastname({
            firstname: beneficiaryRepresentative.firstName,
            lastname: beneficiaryRepresentative.lastName,
          }),
        beneficiaryCurrentEmployerName:
          beneficiaryCurrentEmployer &&
          getFormattedFirstnameAndLastname({
            firstname: beneficiaryCurrentEmployer.firstName,
            lastname: beneficiaryCurrentEmployer.lastName,
          }),
        conventionSignShortlink: makeShortLinkUrl(
          config,
          conventionToSignLinkId,
        ),
        businessName,
        agencyLogoUrl: agency.logoUrl ?? undefined,
      },
    });
  };

export const expectEmailFinalValidationConfirmationParamsMatchingConvention = (
  recipients: string[],
  templatedEmails: TemplatedEmail,
  agency: AgencyDto,
  convention: ConventionDto,
  config: AppConfig,
  conventionToSignLinkId: ShortLinkId,
  assessmentShortlink: ShortLinkId | undefined,
) =>
  expectToEqual(templatedEmails, {
    kind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
    recipients,
    params: {
      conventionId: convention.id,
      internshipKind: convention.internshipKind,
      beneficiaryFirstName: getFormattedFirstnameAndLastname({
        firstname: convention.signatories.beneficiary.firstName,
      }),
      beneficiaryLastName: getFormattedFirstnameAndLastname({
        lastname: convention.signatories.beneficiary.lastName,
      }),
      beneficiaryBirthdate: convention.signatories.beneficiary.birthdate,
      dateStart: parseISO(convention.dateStart).toLocaleDateString("fr"),
      dateEnd: parseISO(convention.dateEnd).toLocaleDateString("fr"),
      establishmentTutorName: getFormattedFirstnameAndLastname({
        firstname: convention.establishmentTutor.firstName,
        lastname: convention.establishmentTutor.lastName,
      }),
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
      assessmentMagicLink: assessmentShortlink
        ? makeShortLinkUrl(config, assessmentShortlink)
        : undefined,
      validatorName: convention.validators?.agencyValidator
        ? getFormattedFirstnameAndLastname(
            convention.validators.agencyValidator,
          )
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
      beneficiaryFirstName: getFormattedFirstnameAndLastname({
        firstname: convention.signatories.beneficiary.firstName,
      }),
      beneficiaryLastName: getFormattedFirstnameAndLastname({
        lastname: convention.signatories.beneficiary.lastName,
      }),
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
      beneficiaryFirstName: getFormattedFirstnameAndLastname({
        firstname: convention.signatories.beneficiary.firstName,
      }),
      beneficiaryLastName: getFormattedFirstnameAndLastname({
        lastname: convention.signatories.beneficiary.lastName,
      }),
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
