import { subHours } from "date-fns";
import {
  type ConventionId,
  type ConventionReadDto,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  type CreateConventionMagicLinkPayloadProperties,
  type UserId,
  errors,
  frontRoutes,
  withConventionIdSchema,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import { createTransactionalUseCase } from "../../core/UseCase";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import { prepareConventionMagicShortLinkMaker } from "../../core/short-link/ShortLink";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import {
  throwErrorIfPhoneNumberNotValid,
  throwErrorOnConventionIdMismatch,
} from "../entities/Convention";

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
    throwErrorOnConventionIdMismatch({
      requestedConventionId: inputParams.conventionId,
      jwtPayload,
    });

    const convention = await uow.conventionQueries.getConventionById(
      inputParams.conventionId,
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    throwErrorIfConventionStatusNotAllowed(convention.status);

    throwErrorIfPhoneNumberNotValid({
      conventionId: convention.id,
      phone: convention.establishmentTutor.phone,
      role: "establishment-tutor",
    });

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
      convention,
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
                kind: "inclusion-connected",
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

const throwErrorIfConventionStatusNotAllowed = (status: ConventionStatus) => {
  if (status !== "ACCEPTED_BY_VALIDATOR") {
    throw errors.assessment.sendAssessmentLinkNotAllowedForStatus({
      status: status,
    });
  }
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
    targetRoute: frontRoutes.conventionToSign,
    lifetime: "short",
    extraQueryParams: { mtm_source: "sms-signature-link" },
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
      kind: "ReminderForSignatories",
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

  if (
    lastSms &&
    new Date(lastSms.createdAt) >
      subHours(timeGateway.now(), MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER)
  ) {
    const nextAllowedTime = new Date(lastSms.createdAt);
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
