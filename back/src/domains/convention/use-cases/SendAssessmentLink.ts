import { addDays, subHours } from "date-fns";
import {
  type AgencyDto,
  type ConventionId,
  type ConventionReadDto,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  type CreateConventionMagicLinkPayloadProperties,
  type Email,
  errors,
  establishmentsRoles,
  frontRoutes,
  type Role,
  type UserId,
  withConventionIdSchema,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { isSomeEmailMatchingEmailHash } from "../../../utils/jwt";
import { getUserWithRights } from "../../connected-users/helpers/userRights.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../core/short-link/ShortLink";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { createTransactionalUseCase } from "../../core/UseCase";
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
    const convention = await uow.conventionQueries.getConventionById(
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

    const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);

    await throwIfNotAllowedToSendAssessmentLink(
      uow,
      convention,
      agency,
      jwtPayload,
    );

    throwErrorIfConventionStatusNotAllowed(convention.status);

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

const throwErrorIfConventionStatusNotAllowed = (status: ConventionStatus) => {
  if (status !== "ACCEPTED_BY_VALIDATOR") {
    throw errors.assessment.sendAssessmentLinkNotAllowedForStatus({
      status: status,
    });
  }
};

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

const throwIfNotAllowedToSendAssessmentLink = async (
  uow: UnitOfWork,
  convention: ConventionReadDto,
  agency: AgencyDto,
  jwtPayload: ConventionRelatedJwtPayload,
) => {
  if (!jwtPayload) throw errors.user.unauthorized();

  if ("userId" in jwtPayload) {
    const userWithRights = await getUserWithRights(uow, jwtPayload.userId);

    const isBackofficeAdmin = userWithRights.isBackofficeAdmin;

    const isEstablishmentRepresentative =
      userWithRights.email ===
      convention.signatories.establishmentRepresentative.email;

    const hasEstablishmentRole = userWithRights.establishments?.some(
      (establishmentRight) =>
        establishmentsRoles.includes(establishmentRight.role),
    );

    const hasEnoughRightsOnAgency = userWithRights.agencyRights.some(
      (agencyRight) =>
        agencyRight.agency.id === convention.agencyId &&
        agencyRight.roles.some((role) =>
          ["validator", "counsellor"].includes(role),
        ),
    );

    if (
      isBackofficeAdmin ||
      isEstablishmentRepresentative ||
      hasEnoughRightsOnAgency
    ) {
      return;
    }

    if (hasEstablishmentRole) {
      throw errors.assessment.sendAssessmentLinkForbidden();
    }

    if (!hasEnoughRightsOnAgency)
      throw errors.user.notEnoughRightOnAgency({
        userId: jwtPayload.userId,
        agencyId: convention.agencyId,
      });

    throw errors.assessment.sendAssessmentLinkForbidden();
  }

  if ("applicationId" in jwtPayload) {
    const { emailHash, role } = jwtPayload;

    throwErrorOnConventionIdMismatch({
      requestedConventionId: convention.id,
      jwtPayload,
    });

    const emailsOrError = getEmailsByRoleForReminder(
      convention,
      agency,
      errors.assessment.sendAssessmentLinkForbidden(),
    )[role];

    if (emailsOrError instanceof Error) throw emailsOrError;

    if (!isSomeEmailMatchingEmailHash(emailsOrError, emailHash))
      throw errors.convention.emailNotLinkedToConvention(role);
  }
};

const getEmailsByRoleForReminder = (
  convention: ConventionReadDto,
  agency: AgencyDto,
  forbiddenError: Error,
): Record<Role, Email[] | Error> => ({
  "back-office": forbiddenError,
  "to-review": forbiddenError,
  "agency-viewer": forbiddenError,
  beneficiary: [convention.signatories.beneficiary.email],
  "beneficiary-current-employer": [
    convention.signatories.beneficiaryCurrentEmployer?.email ?? "",
  ],
  "beneficiary-representative": [
    convention.signatories.beneficiaryRepresentative?.email ?? "",
  ],
  "agency-admin": forbiddenError,
  "establishment-representative": [
    convention.signatories.establishmentRepresentative.email,
  ],
  "establishment-tutor": [convention.establishmentTutor.email],
  counsellor: agency.counsellorEmails,
  validator: agency.validatorEmails,
  "establishment-admin": forbiddenError,
  "establishment-contact": forbiddenError,
});
