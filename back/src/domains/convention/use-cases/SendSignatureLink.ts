import { subHours } from "date-fns";
import {
  ConventionId,
  ConventionReadDto,
  ConventionRelatedJwtPayload,
  ConventionStatus,
  CreateConventionMagicLinkPayloadProperties,
  SignatoryRole,
  UserId,
  conventionIdSchema,
  conventionSignatoryRoleBySignatoryKey,
  errors,
  frontRoutes,
  signatoryRoleSchema,
} from "shared";
import { z } from "zod";
import { AppConfig } from "../../../config/bootstrap/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import { createTransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import { prepareMagicShortLinkMaker } from "../../core/short-link/ShortLink";
import { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import {
  throwErrorIfPhoneNumberNotValid,
  throwErrorIfSignatoryAlreadySigned,
  throwErrorOnConventionIdMismatch,
  throwIfNotAllowedForUser,
} from "../entities/Convention";

export const MIN_HOURS_BETWEEN_REMINDER = 24;

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

    const convention = await uow.conventionQueries.getConventionById(
      inputParams.conventionId,
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    throwErrorIfConventionStatusNotAllowed(convention.status);
    await throwIfNotAllowedForUser({
      uow,
      jwtPayload,
      agencyId: convention.agencyId,
      convention,
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

    throwErrorIfPhoneNumberNotValid({
      convention,
      signatoryKey,
      signatoryRole: inputParams.role,
    });

    throwErrorIfSignatoryAlreadySigned({
      convention,
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
      convention,
      ...deps,
    });
  },
);

const throwErrorIfConventionStatusNotAllowed = (status: ConventionStatus) => {
  if (!["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(status)) {
    throw errors.convention.sendSignatureLinkNotAllowedForStatus({
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
  const makeShortMagicLink = prepareMagicShortLinkMaker({
    config,
    conventionMagicLinkPayload: conventionMagicLinkPayload,
    generateConventionMagicLinkUrl: generateConventionMagicLinkUrl,
    shortLinkIdGeneratorGateway: shortLinkIdGeneratorGateway,
    uow,
  });

  const shortLink = await makeShortMagicLink({
    targetRoute: frontRoutes.conventionToSign,
    lifetime: "short",
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
      kind: "LastReminderForSignatories",
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
    smsKind: "LastReminderForSignatories",
    conventionId,
    recipientPhoneNumber: signatoryPhoneNumber,
  });

  if (
    lastSms &&
    new Date(lastSms.createdAt) >
      subHours(timeGateway.now(), MIN_HOURS_BETWEEN_REMINDER)
  ) {
    throw errors.convention.smsSignatureLinkAlreadySent({
      signatoryRole,
      minHoursBetweenReminder: MIN_HOURS_BETWEEN_REMINDER,
    });
  }
};
