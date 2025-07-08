import { subHours } from "date-fns";
import {
  agencyModifierRoles,
  allSignatoryRoles,
  type ConventionId,
  type ConventionReadDto,
  type ConventionRelatedJwtPayload,
  type CreateConventionMagicLinkPayloadProperties,
  conventionIdSchema,
  conventionSignatoryRoleBySignatoryKey,
  errors,
  frontRoutes,
  type SignatoryRole,
  signatoryRoleSchema,
  type UserId,
} from "shared";
import { z } from "zod";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import {
  conventionDtoToConventionReadDto,
  throwErrorIfConventionStatusNotAllowed,
} from "../../../utils/convention";
import { throwIfNotAuthorizedForRole } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../core/short-link/ShortLink";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { createTransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import {
  throwErrorIfSignatoryAlreadySigned,
  throwErrorIfSignatoryPhoneNumberNotValid,
  throwErrorOnConventionIdMismatch,
} from "../entities/Convention";

export const MIN_HOURS_BETWEEN_SIGNATURE_REMINDER = 24;

type SendSignatureLinkParams = {
  conventionId: ConventionId;
  role: SignatoryRole;
};

const sendSignatureLinkParamsSchema: z.Schema<SendSignatureLinkParams> =
  z.object({
    conventionId: conventionIdSchema,
    role: signatoryRoleSchema,
  });

export type SendSignatureLink = ReturnType<typeof makeSendSignatureLink>;

export const makeSendSignatureLink = createTransactionalUseCase<
  SendSignatureLinkParams,
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
    name: "RemindSignatories",
    inputSchema: sendSignatureLinkParamsSchema,
  },
  async ({ inputParams, uow, deps, currentUser: jwtPayload }) => {
    throwErrorOnConventionIdMismatch({
      requestedConventionId: inputParams.conventionId,
      jwtPayload,
    });

    const convention = await uow.conventionRepository.getById(
      inputParams.conventionId,
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    const conventionRead = await conventionDtoToConventionReadDto(
      convention,
      uow,
    );

    throwErrorIfConventionStatusNotAllowed(
      convention.status,
      ["READY_TO_SIGN", "PARTIALLY_SIGNED"],
      errors.convention.sendSignatureLinkNotAllowedForStatus({
        status: convention.status,
      }),
    );

    await throwIfNotAuthorizedForRole({
      uow,
      convention: conventionRead,
      authorizedRoles: [
        ...agencyModifierRoles,
        "back-office",
        ...allSignatoryRoles,
      ],
      errorToThrow: errors.convention.sendSignatureLinkNotAuthorizedForRole(),
      jwtPayload,
      isPeAdvisorAllowed: true,
      isValidatorOfAgencyRefersToAllowed: true,
    });

    const signatoryKey =
      conventionSignatoryRoleBySignatoryKey[inputParams.role];
    const signatory = convention.signatories[signatoryKey];
    if (!signatory) {
      throw errors.convention.missingActor({
        conventionId: convention.id,
        role: inputParams.role,
      });
    }

    throwErrorIfSignatoryPhoneNumberNotValid({
      convention: conventionRead,
      signatoryKey,
      signatoryRole: inputParams.role,
    });

    throwErrorIfSignatoryAlreadySigned({
      convention: conventionRead,
      signatoryKey,
      signatoryRole: inputParams.role,
    });

    await throwErrorIfSignatureLinkAlreadySent({
      timeGateway: deps.timeGateway,
      signatoryPhoneNumber: signatory.phone,
      signatoryRole: signatory.role,
      notificationRepository: uow.notificationRepository,
      conventionId: convention.id,
    });

    await sendSms({
      conventionMagicLinkPayload: {
        id: convention.id,
        role: inputParams.role,
        email: signatory.email,
        now: deps.timeGateway.now(),
      },
      userId: "userId" in jwtPayload ? jwtPayload.userId : undefined,
      signatoryPhone: signatory.phone,
      uow,
      convention: conventionRead,
      ...deps,
    });

    const event = deps.createNewEvent({
      topic: "ConventionSignatureLinkManuallySent",
      payload: {
        convention,
        recipientRole: signatory.role,
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

const sendSms = async ({
  conventionMagicLinkPayload,
  saveNotificationAndRelatedEvent,
  generateConventionMagicLinkUrl,
  shortLinkIdGeneratorGateway,
  config,
  convention,
  uow,
  signatoryPhone,
  userId,
}: {
  conventionMagicLinkPayload: CreateConventionMagicLinkPayloadProperties;
  saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
  config: AppConfig;
  convention: ConventionReadDto;
  uow: UnitOfWork;
  signatoryPhone: string;
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
      recipientPhone: signatoryPhone,
      kind: "ReminderForSignatories",
      params: { shortLink: shortLink },
    },
  });
};

const throwErrorIfSignatureLinkAlreadySent = async ({
  notificationRepository,
  timeGateway,
  conventionId,
  signatoryPhoneNumber,
  signatoryRole,
}: {
  notificationRepository: NotificationRepository;
  timeGateway: TimeGateway;
  conventionId: ConventionId;
  signatoryPhoneNumber: string;
  signatoryRole: SignatoryRole;
}) => {
  const lastSms = await notificationRepository.getLastSmsNotificationByFilter({
    smsKind: "ReminderForSignatories",
    conventionId,
    recipientPhoneNumber: signatoryPhoneNumber,
  });

  if (
    lastSms &&
    new Date(lastSms.createdAt) >
      subHours(timeGateway.now(), MIN_HOURS_BETWEEN_SIGNATURE_REMINDER)
  ) {
    const nextAllowedTime = new Date(lastSms.createdAt);
    nextAllowedTime.setHours(
      nextAllowedTime.getHours() + MIN_HOURS_BETWEEN_SIGNATURE_REMINDER,
    );
    const timeRemainingMs =
      nextAllowedTime.getTime() - timeGateway.now().getTime();
    const hoursRemaining = Math.floor(timeRemainingMs / (1000 * 60 * 60));
    const minutesRemaining = Math.ceil(
      (timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60),
    );
    const formattedTimeRemaining = `${hoursRemaining}h${minutesRemaining.toString().padStart(2, "0")}`;

    throw errors.convention.smsSignatureLinkAlreadySent({
      signatoryRole,
      minHoursBetweenReminder: MIN_HOURS_BETWEEN_SIGNATURE_REMINDER,
      timeRemaining: formattedTimeRemaining,
    });
  }
};
