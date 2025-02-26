import { subHours } from "date-fns";
import { parsePhoneNumber } from "libphonenumber-js/mobile";
import { intersection, toPairs } from "ramda";
import {
  AgencyId,
  ConventionId,
  ConventionReadDto,
  ConventionRelatedJwtPayload,
  ConventionStatus,
  CreateConventionMagicLinkPayloadProperties,
  Signatories,
  SignatoryRole,
  UserId,
  agencyModifierRoles,
  conventionIdSchema,
  conventionSignatoryRoleBySignatoryKey,
  errors,
  frontRoutes,
  isSomeEmailMatchingEmailHash,
  signatorySchema,
} from "shared";
import { z } from "zod";
import { AppConfig } from "../../../config/bootstrap/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import { isHashMatchPeAdvisorEmail } from "../../../utils/emailHash";
import { createTransactionalUseCase } from "../../core/UseCase";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import { prepareMagicShortLinkMaker } from "../../core/short-link/ShortLink";
import { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { getUserWithRights } from "../../inclusion-connected-users/helpers/userRights.helper";

type RemindSignatoriesParams = {
  conventionId: ConventionId;
  role: SignatoryRole;
};

const remindSignatoriesParamsSchema: z.Schema<RemindSignatoriesParams> =
  z.object({
    conventionId: conventionIdSchema,
    role: signatorySchema,
  });

export type RemindSignatories = ReturnType<typeof makeRemindSignatories>;

export const MIN_HOURS_BETWEEN_REMINDER = 24;

export const makeRemindSignatories = createTransactionalUseCase<
  RemindSignatoriesParams,
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
    inputSchema: remindSignatoriesParamsSchema,
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

    throwErrorIfPhoneNumerNotValid({
      convention,
      signatoryKey,
      signatoryRole: inputParams.role,
    });

    throwErrorIfSignatoryAlreadySigned({
      convention,
      signatoryKey,
      signatoryRole: inputParams.role,
    });

    await throwErrorIfReminderAlreadySent({
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

const throwErrorOnConventionIdMismatch = ({
  requestedConventionId,
  jwtPayload,
}: {
  requestedConventionId: ConventionId;
  jwtPayload: ConventionRelatedJwtPayload;
}) => {
  if (
    "applicationId" in jwtPayload &&
    requestedConventionId !== jwtPayload.applicationId
  )
    throw errors.convention.forbiddenMissingRights({
      conventionId: requestedConventionId,
    });
};

const throwErrorIfConventionStatusNotAllowed = (status: ConventionStatus) => {
  if (!["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(status)) {
    throw errors.convention.signReminderNotAllowedForStatus({
      status: status,
    });
  }
};

const throwIfNotAllowedForUser = async ({
  uow,
  jwtPayload,
  agencyId,
  convention,
}: {
  jwtPayload: ConventionRelatedJwtPayload;
  uow: UnitOfWork;
  agencyId: AgencyId;
  convention: ConventionReadDto;
}): Promise<void> => {
  if ("role" in jwtPayload) {
    if (!agencyModifierRoles.includes(jwtPayload.role as any))
      throw errors.convention.unsupportedRoleSignReminder({
        role: jwtPayload.role as any,
      });

    const agency = await uow.agencyRepository.getById(agencyId);

    if (!agency) throw errors.agency.notFound({ agencyId });

    const userIdsWithRoleOnAgency = toPairs(agency.usersRights)
      .filter(
        ([_, right]) =>
          right?.roles.includes("counsellor") ||
          right?.roles.includes("validator"),
      )
      .map(([id]) => id);

    const users = await uow.userRepository.getByIds(
      userIdsWithRoleOnAgency,
      await makeProvider(uow),
    );

    if (
      !isHashMatchPeAdvisorEmail({
        convention,
        emailHash: jwtPayload.emailHash,
      }) &&
      !isSomeEmailMatchingEmailHash(
        users.map(({ email }) => email),
        jwtPayload.emailHash,
      )
    )
      throw errors.user.notEnoughRightOnAgency({
        agencyId,
      });

    return;
  }

  const userWithRights = await getUserWithRights(uow, jwtPayload.userId);
  if (!userWithRights)
    throw errors.user.notFound({
      userId: jwtPayload.userId,
    });

  const agencyRightOnAgency = userWithRights.agencyRights.find(
    (agencyRight) => agencyRight.agency.id === agencyId,
  );

  if (!agencyRightOnAgency)
    throw errors.user.noRightsOnAgency({
      userId: userWithRights.id,
      agencyId: agencyId,
    });

  if (intersection(agencyModifierRoles, agencyRightOnAgency.roles).length === 0)
    throw errors.user.notEnoughRightOnAgency({
      agencyId,
      userId: userWithRights.id,
    });
};

const throwErrorIfPhoneNumerNotValid = ({
  convention,
  signatoryRole,
  signatoryKey,
}: {
  convention: ConventionReadDto;
  signatoryKey: keyof Signatories;
  signatoryRole: SignatoryRole;
}) => {
  if (!convention.signatories[signatoryKey]) {
    throw new Error();
  }

  const isValidMobilePhone =
    parsePhoneNumber(convention.signatories[signatoryKey].phone).getType() ===
    "MOBILE";
  if (!isValidMobilePhone)
    throw errors.convention.invalidMobilePhoneNumber({
      conventionId: convention.id,
      signatoryRole,
    });
};

const throwErrorIfSignatoryAlreadySigned = ({
  convention,
  signatoryRole,
  signatoryKey,
}: {
  convention: ConventionReadDto;
  signatoryRole: SignatoryRole;
  signatoryKey: keyof Signatories;
}) => {
  if (convention.signatories[signatoryKey]?.signedAt) {
    throw errors.convention.signatoryAlreadySigned({
      conventionId: convention.id,
      signatoryRole,
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

const throwErrorIfReminderAlreadySent = async ({
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
    throw errors.convention.smsReminderAlreadySent({
      signatoryRole,
      minHoursBetweenReminder: MIN_HOURS_BETWEEN_REMINDER,
    });
  }
};
