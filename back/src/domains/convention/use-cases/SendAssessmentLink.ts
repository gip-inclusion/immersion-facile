import { addDays } from "date-fns";
import {
  agencyModifierRoles,
  allSignatoryRoles,
  assessmentEmailSender,
  type ConventionId,
  type ConventionReadDto,
  type ConventionRelatedJwtPayload,
  errors,
  formatHoursCooldownTimeRemaining,
  getFormattedFirstnameAndLastname,
  isWithinHoursCooldown,
  type NotificationKind,
  type SendAssessmentLinkRequestDto,
  sendAssessmentLinkRequestSchema,
  type UserId,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import {
  conventionDtoToConventionReadDto,
  throwErrorIfConventionStatusNotAllowed,
} from "../../../utils/convention";
import type { CreateConventionMagicLinkPayloadProperties } from "../../../utils/jwt";
import { throwIfNotAuthorizedForRole } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../core/short-link/ShortLink";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { throwErrorIfPhoneNumberNotValid } from "../entities/Convention";

export const MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER = 24;

export type SendAssessmentLink = ReturnType<typeof makeSendAssessmentLink>;
export const makeSendAssessmentLink = useCaseBuilder("SendAssessmentLink")
  .withInput<SendAssessmentLinkRequestDto>(sendAssessmentLinkRequestSchema)
  .withOutput<void>()
  .withCurrentUser<ConventionRelatedJwtPayload>()
  .withDeps<{
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
    timeGateway: TimeGateway;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    config: AppConfig;
    createNewEvent: CreateNewEvent;
  }>()
  .build(async ({ inputParams, uow, deps, currentUser: jwtPayload }) => {
    const notificationKind = inputParams.notificationKind;
    const convention = await uow.conventionRepository.getById(
      inputParams.conventionId,
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    const agencyWithRights = await uow.agencyRepository.getById(
      convention.agencyId,
    );
    if (!agencyWithRights)
      throw errors.agency.notFound({ agencyId: convention.agencyId });

    const conventionRead = await conventionDtoToConventionReadDto(
      convention,
      uow,
    );

    await throwIfNotAuthorizedForRole({
      uow,
      convention: conventionRead,
      authorizedRoles: [
        ...agencyModifierRoles,
        ...allSignatoryRoles,
        "back-office",
      ],
      errorToThrow: errors.assessment.sendAssessmentLinkForbidden(),
      jwtPayload,
      isPeAdvisorAllowed: true,
      isValidatorOfAgencyRefersToAllowed: true,
    });

    throwErrorIfConventionStatusNotAllowed(
      convention.status,
      ["ACCEPTED_BY_VALIDATOR"],
      errors.assessment.sendAssessmentLinkNotAllowedForStatus({
        status: convention.status,
      }),
    );

    throwErrorIfConventionEndInMoreThanOneDay(
      new Date(convention.dateEnd),
      deps.timeGateway.now(),
    );

    await throwErrorIfAssessmentAlreadyFullfilled(convention.id, uow);

    await throwErrorIfAssessmentLinkAlreadySent({
      timeGateway: deps.timeGateway,
      notificationKind,
      tutorEmail: convention.establishmentTutor.email,
      tutorPhoneNumber: convention.establishmentTutor.phone,
      notificationRepository: uow.notificationRepository,
      conventionId: convention.id,
    });

    if (notificationKind === "sms") {
      const recipientPhone = convention.establishmentTutor.phone;
      throwErrorIfPhoneNumberNotValid({
        conventionId: convention.id,
        phone: recipientPhone,
        role: "establishment-tutor",
      });

      await sendSms({
        conventionMagicLinkPayload: {
          id: convention.id,
          role: "establishment-tutor",
          email: convention.establishmentTutor.email,
          now: deps.timeGateway.now(),
        },
        userId: "userId" in jwtPayload ? jwtPayload.userId : undefined,
        recipientPhone,
        uow,
        convention: conventionRead,
        ...deps,
      });
    }
    if (notificationKind === "email") {
      await sendEmail({
        conventionMagicLinkPayload: {
          id: convention.id,
          role: "establishment-tutor",
          email: convention.establishmentTutor.email,
          now: deps.timeGateway.now(),
        },
        uow,
        convention: conventionRead,
        ...deps,
      });
    }

    const event = deps.createNewEvent({
      topic: "AssessmentReminderManuallySent",
      payload: {
        convention,
        transport: notificationKind,
        triggeredBy:
          "userId" in jwtPayload
            ? {
                kind: "connected-user",
                userId: jwtPayload.userId,
              }
            : {
                kind: "convention-magic-link",
                role: jwtPayload.role,
              },
      },
    });

    await uow.outboxRepository.save(event);
  });

const throwErrorIfConventionEndInMoreThanOneDay = (
  conventionDateEnd: Date,
  today: Date,
) => {
  if (conventionDateEnd > addDays(today, 1)) {
    throw errors.assessment.conventionEndingInMoreThanOneDay();
  }
};

const throwErrorIfAssessmentAlreadyFullfilled = async (
  conventionId: ConventionId,
  uow: UnitOfWork,
) => {
  const assessment =
    await uow.assessmentRepository.getByConventionId(conventionId);

  if (assessment)
    throw errors.assessment.assessmentAlreadyFullfilled(conventionId);
};

const sendSms = async ({
  conventionMagicLinkPayload,
  saveNotificationAndRelatedEvent,
  generateConventionMagicLinkUrl,
  shortLinkIdGeneratorGateway,
  config,
  convention,
  uow,
  recipientPhone,
  userId,
}: {
  conventionMagicLinkPayload: CreateConventionMagicLinkPayloadProperties;
  saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
  config: AppConfig;
  convention: ConventionReadDto;
  uow: UnitOfWork;
  recipientPhone: string;
  userId: UserId | undefined;
}) => {
  const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
    config,
    conventionMagicLinkPayload: conventionMagicLinkPayload,
    generateConventionMagicLinkUrl: generateConventionMagicLinkUrl,
    shortLinkIdGeneratorGateway: shortLinkIdGeneratorGateway,
    uow,
  });

  const shortLink = await makeShortMagicLink({
    targetRoute: "assessment",
    lifetime: "2Days",
    extraQueryParams: { mtm_campaign: "sms-assessment-link" },
  });

  await saveNotificationAndRelatedEvent(uow, {
    kind: "sms",
    followedIds: {
      conventionId: convention.id,
      agencyId: convention.agencyId,
      establishmentSiret: convention.siret,
      userId: userId,
    },
    templatedContent: {
      recipientPhone,
      kind: "ReminderForAssessment",
      params: { shortLink: shortLink },
    },
  });
};

const sendEmail = async ({
  conventionMagicLinkPayload,
  saveNotificationAndRelatedEvent,
  generateConventionMagicLinkUrl,
  shortLinkIdGeneratorGateway,
  config,
  convention,
  uow,
}: {
  conventionMagicLinkPayload: CreateConventionMagicLinkPayloadProperties;
  saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
  config: AppConfig;
  convention: ConventionReadDto;
  uow: UnitOfWork;
}) => {
  const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
    config,
    conventionMagicLinkPayload: conventionMagicLinkPayload,
    generateConventionMagicLinkUrl: generateConventionMagicLinkUrl,
    shortLinkIdGeneratorGateway: shortLinkIdGeneratorGateway,
    uow,
  });
  const assessmentCreationLink = await makeShortMagicLink({
    targetRoute: "assessment",
    lifetime: "2Days",
    extraQueryParams: { mtm_campaign: "email-assessment-link" },
  });

  await saveNotificationAndRelatedEvent(uow, {
    kind: "email",
    followedIds: {
      conventionId: convention.id,
      agencyId: convention.agencyId,
      establishmentSiret: convention.siret,
    },
    templatedContent: {
      kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
      recipients: [convention.establishmentTutor.email],
      sender: assessmentEmailSender,
      params: {
        beneficiaryFirstName: getFormattedFirstnameAndLastname({
          firstname: convention.signatories.beneficiary.firstName,
        }),
        beneficiaryLastName: getFormattedFirstnameAndLastname({
          lastname: convention.signatories.beneficiary.lastName,
        }),
        conventionId: convention.id,
        establishmentTutorName: getFormattedFirstnameAndLastname({
          firstname: convention.establishmentTutor.firstName,
          lastname: convention.establishmentTutor.lastName,
        }),
        agencyLogoUrl: undefined,
        assessmentCreationLink,
        internshipKind: convention.internshipKind,
      },
    },
  });
};

const throwErrorIfAssessmentLinkAlreadySent = async ({
  notificationRepository,
  timeGateway,
  notificationKind,
  conventionId,
  tutorEmail,
  tutorPhoneNumber,
}: {
  notificationRepository: NotificationRepository;
  timeGateway: TimeGateway;
  notificationKind: NotificationKind;
  conventionId: ConventionId;
  tutorEmail: string;
  tutorPhoneNumber: string;
}) => {
  const lastNotification =
    notificationKind === "sms"
      ? await notificationRepository.getLastSmsNotificationByFilter({
          smsKind: "ReminderForAssessment",
          conventionId,
          recipientPhoneNumber: tutorPhoneNumber,
        })
      : await notificationRepository.getLastEmailNotificationByFilter({
          emailKind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
          conventionId,
          recipientEmail: tutorEmail,
        });

  const lastNotificationCreatedAt =
    lastNotification && new Date(lastNotification.createdAt);

  if (
    lastNotificationCreatedAt &&
    isWithinHoursCooldown({
      lastActionAt: lastNotificationCreatedAt,
      minHours: MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER,
      now: timeGateway.now(),
    })
  )
    throw errors.assessment.assessmentLinkAlreadySent({
      notificationKind,
      minHoursBetweenReminder: MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER,
      timeRemaining: formatHoursCooldownTimeRemaining({
        lastActionAt: lastNotificationCreatedAt,
        minHours: MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER,
        now: timeGateway.now(),
      }),
    });
};
