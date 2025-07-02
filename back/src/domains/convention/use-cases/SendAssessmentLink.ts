import { addDays, subHours } from "date-fns";
import {
  agencyModifierRoles,
  allSignatoryRoles,
  type ConventionId,
  type ConventionReadDto,
  type ConventionRelatedJwtPayload,
  type CreateConventionMagicLinkPayloadProperties,
  errors,
  frontRoutes,
  type UserId,
  withConventionIdSchema,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import {
  conventionDtoToConventionReadDto,
  throwErrorIfConventionStatusNotAllowed,
} from "../../../utils/convention";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../core/short-link/ShortLink";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { createTransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { throwIfNotAuthorizedForRole } from "../../inclusion-connected-users/helpers/authorization.helper";
import { throwErrorIfPhoneNumberNotValid } from "../entities/Convention";

export const MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER = 24;

export type SendAssessmentLink = ReturnType<typeof makeSendAssessmentLink>;

export const makeSendAssessmentLink = createTransactionalUseCase<
  { conventionId: ConventionId },
  void,
  ConventionRelatedJwtPayload,
  {
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
    timeGateway: TimeGateway;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    config: AppConfig;
    createNewEvent: CreateNewEvent;
  }
>(
  {
    name: "SendAssessmentLink",
    inputSchema: withConventionIdSchema,
  },
  async ({ inputParams, uow, deps, currentUser: jwtPayload }) => {
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

    throwErrorIfPhoneNumberNotValid({
      conventionId: convention.id,
      phone: convention.establishmentTutor.phone,
      role: "establishment-tutor",
    });

    await throwErrorIfAssessmentAlreadyFullfilled(convention.id, uow);

    await throwErrorIfAssessmentLinkAlreadySent({
      timeGateway: deps.timeGateway,
      tutorPhoneNumber: convention.establishmentTutor.phone,
      notificationRepository: uow.notificationRepository,
      conventionId: convention.id,
    });

    await sendSms({
      conventionMagicLinkPayload: {
        id: convention.id,
        role: "establishment-tutor",
        email: convention.establishmentTutor.email,
        now: deps.timeGateway.now(),
      },
      userId: "userId" in jwtPayload ? jwtPayload.userId : undefined,
      recipientPhone: convention.establishmentTutor.phone,
      uow,
      convention: conventionRead,
      ...deps,
    });

    const event = deps.createNewEvent({
      topic: "AssessmentReminderManuallySent",
      payload: {
        convention,
        transport: "sms",
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
  },
);

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
    targetRoute: frontRoutes.assessment,
    lifetime: "short",
    extraQueryParams: { mtm_source: "sms-assessment-link" },
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

const throwErrorIfAssessmentLinkAlreadySent = async ({
  notificationRepository,
  timeGateway,
  conventionId,
  tutorPhoneNumber,
}: {
  notificationRepository: NotificationRepository;
  timeGateway: TimeGateway;
  conventionId: ConventionId;
  tutorPhoneNumber: string;
}) => {
  const lastSms = await notificationRepository.getLastSmsNotificationByFilter({
    smsKind: "ReminderForAssessment",
    conventionId,
    recipientPhoneNumber: tutorPhoneNumber,
  });

  const lastSmsCreatedAt = lastSms && new Date(lastSms.createdAt);

  if (
    lastSmsCreatedAt &&
    lastSmsCreatedAt >
      subHours(timeGateway.now(), MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER)
  ) {
    const nextAllowedTime = lastSmsCreatedAt;
    nextAllowedTime.setHours(
      nextAllowedTime.getHours() + MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER,
    );
    const timeRemainingMs =
      nextAllowedTime.getTime() - timeGateway.now().getTime();
    const hoursRemaining = Math.floor(timeRemainingMs / (1000 * 60 * 60));
    const minutesRemaining = Math.ceil(
      (timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60),
    );
    const formattedTimeRemaining = `${hoursRemaining}h${minutesRemaining.toString().padStart(2, "0")}`;

    throw errors.assessment.smsAssessmentLinkAlreadySent({
      minHoursBetweenReminder: MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER,
      timeRemaining: formattedTimeRemaining,
    });
  }
};
