import subDays from "date-fns/subDays";
import { difference } from "ramda";
import {
  type AbsoluteUrl,
  type AgencyRole,
  type ConventionId,
  type ConventionReadDto,
  type Email,
  errors,
  executeInSequence,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  immersionFacileNoReplyEmailSender,
  localization,
} from "shared";
import { z } from "zod";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import type { AssessmentRepository } from "../../convention/ports/AssessmentRepository";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import type { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../core/short-link/ShortLink";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";

type AssessmentReminderOutput = {
  numberOfConventionsReminded: number;
};

type SendAssessmentReminderParams = {
  uow: UnitOfWork;
  convention: ConventionReadDto;
  now: Date;
  saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
  config: AppConfig;
};

const allAssessmentReminderModes = [
  "3daysAfterInitialAssessmentEmail",
  "10daysAfterInitialAssessmentEmail",
] as const;
export type AssessmentReminderMode =
  (typeof allAssessmentReminderModes)[number];

type OutOfTrxDependencies = {
  assessmentRepository: AssessmentRepository;
  notificationRepository: NotificationRepository;
};

export type AssessmentReminder = ReturnType<typeof makeAssessmentReminder>;
export const makeAssessmentReminder = useCaseBuilder("AssessmentReminder")
  .withInput<{ mode: AssessmentReminderMode }>(
    z.object({
      mode: z.enum(allAssessmentReminderModes, {
        error: localization.invalidEnum,
      }),
    }),
  )
  .withOutput<AssessmentReminderOutput>()
  .withCurrentUser<void>()
  .withDeps<{
    timeGateway: TimeGateway;
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
    config: AppConfig;
    outOfTrx: OutOfTrxDependencies;
  }>()
  .build(async ({ inputParams: params, uow, deps }) => {
    const now = deps.timeGateway.now();
    const conventionIdsToRemind = await getConventionIdsToRemind({
      mode: params.mode,
      now,
      outOfTrx: deps.outOfTrx,
    });

    await executeInSequence(conventionIdsToRemind, async (conventionId) => {
      const convention =
        await uow.conventionQueries.getConventionById(conventionId);
      if (!convention)
        throw errors.convention.notFound({ conventionId: conventionId });
      await sendAssessmentReminders({
        uow,
        convention,
        now,
        generateConventionMagicLinkUrl: deps.generateConventionMagicLinkUrl,
        saveNotificationAndRelatedEvent: deps.saveNotificationAndRelatedEvent,
        shortLinkIdGeneratorGateway: deps.shortLinkIdGeneratorGateway,
        config: deps.config,
      });
    });

    return {
      numberOfConventionsReminded: conventionIdsToRemind.length,
    };
  });

const getConventionIdsToRemind = async ({
  mode,
  now,
  outOfTrx,
}: {
  mode: AssessmentReminderMode;
  now: Date;
  outOfTrx: OutOfTrxDependencies;
}): Promise<ConventionId[]> => {
  const daysAfterLastNotifications =
    mode === "3daysAfterInitialAssessmentEmail" ? 3 : 10;

  const notificationSentToEstablishments =
    await outOfTrx.notificationRepository.getEmailsByFilters({
      emailType: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
      createdAt: subDays(now, daysAfterLastNotifications),
    });

  const potentialConventionsToRemind = notificationSentToEstablishments
    .map((notification) => notification.followedIds.conventionId)
    .filter((conventionId) => conventionId !== undefined);

  const conventionsWithAssessments = (
    await outOfTrx.assessmentRepository.getByConventionIds(
      potentialConventionsToRemind,
    )
  ).map((assessment) => assessment.conventionId);

  return difference(potentialConventionsToRemind, conventionsWithAssessments);
};

const createTutorNotification = ({
  convention,
  assessmentCreationLink,
}: {
  convention: ConventionReadDto;
  assessmentCreationLink: AbsoluteUrl;
}): NotificationContentAndFollowedIds => {
  return {
    followedIds: {
      agencyId: convention.agencyId,
      conventionId: convention.id,
      establishmentSiret: convention.siret,
    },
    kind: "email",
    templatedContent: {
      kind: "ASSESSMENT_ESTABLISHMENT_REMINDER",
      params: {
        beneficiaryFirstName: getFormattedFirstnameAndLastname({
          firstname: convention.signatories.beneficiary.firstName,
        }),
        beneficiaryLastName: getFormattedFirstnameAndLastname({
          lastname: convention.signatories.beneficiary.lastName,
        }),
        conventionId: convention.id,
        internshipKind: convention.internshipKind,
        establishmentTutorFirstName: getFormattedFirstnameAndLastname({
          firstname: convention.establishmentTutor.firstName,
        }),
        establishmentTutorLastName: getFormattedFirstnameAndLastname({
          lastname: convention.establishmentTutor.lastName,
        }),
        assessmentCreationLink,
      },
      recipients: [convention.establishmentTutor.email],
      sender: immersionFacileNoReplyEmailSender,
    },
  };
};

const sendAssessmentReminders = async ({
  uow,
  saveNotificationAndRelatedEvent,
  convention,
  now,
  generateConventionMagicLinkUrl,
  shortLinkIdGeneratorGateway,
  config,
}: SendAssessmentReminderParams) => {
  await sendTutorAssessmentReminder({
    uow,
    saveNotificationAndRelatedEvent,
    generateConventionMagicLinkUrl,
    convention,
    now,
    shortLinkIdGeneratorGateway,
    config,
  });
  await sendAgencyAssessmentReminder({
    uow,
    saveNotificationAndRelatedEvent,
    generateConventionMagicLinkUrl,
    convention,
    now,
    shortLinkIdGeneratorGateway,
    config,
  });
};

const sendTutorAssessmentReminder = async ({
  uow,
  saveNotificationAndRelatedEvent,
  convention,
  now,
  generateConventionMagicLinkUrl,
  shortLinkIdGeneratorGateway,
  config,
}: SendAssessmentReminderParams) => {
  const tutorEmail = convention.establishmentTutor.email;
  const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
    config,
    conventionMagicLinkPayload: {
      id: convention.id,
      email: tutorEmail,
      role: "establishment-tutor",
      now,
    },
    generateConventionMagicLinkUrl: generateConventionMagicLinkUrl,
    shortLinkIdGeneratorGateway: shortLinkIdGeneratorGateway,
    uow,
  });
  const assessmentCreationLink = await makeShortMagicLink({
    targetRoute: frontRoutes.assessment,
    lifetime: "short",
    extraQueryParams: { mtm_source: "assessment-reminder" },
  });

  const notification = createTutorNotification({
    convention,
    assessmentCreationLink,
  });
  await saveNotificationAndRelatedEvent(uow, notification);
};

const sendAgencyAssessmentReminder = async ({
  uow,
  saveNotificationAndRelatedEvent,
  convention,
  now,
  generateConventionMagicLinkUrl,
  shortLinkIdGeneratorGateway,
  config,
}: SendAssessmentReminderParams) => {
  if (convention.internshipKind !== "immersion") return;

  const agencyWithUserRights = await uow.agencyRepository.getById(
    convention.agencyId,
  );
  if (!agencyWithUserRights)
    throw errors.agency.notFound({ agencyId: convention.agencyId });

  const conventionAdvisorEntity =
    await uow.conventionFranceTravailAdvisorRepository.getByConventionId(
      convention.id,
    );

  const advisorEmail = conventionAdvisorEntity?.advisor?.email;
  const agency = await agencyWithRightToAgencyDto(uow, agencyWithUserRights);

  const recipientsEmailAndRole: { email: Email; role: AgencyRole }[] =
    advisorEmail
      ? [{ email: advisorEmail, role: "validator" }]
      : [
          ...agency.validatorEmails.map((email) => ({
            email,
            role: "validator" as const,
          })),
          ...agency.counsellorEmails.map((email) => ({
            email,
            role: "counsellor" as const,
          })),
        ];

  await Promise.all(
    recipientsEmailAndRole.map(async ({ email, role }) => {
      const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
        config,
        conventionMagicLinkPayload: {
          id: convention.id,
          email,
          role,
          now,
        },
        generateConventionMagicLinkUrl: generateConventionMagicLinkUrl,
        shortLinkIdGeneratorGateway: shortLinkIdGeneratorGateway,
        uow,
      });
      const assessmentCreationLink = await makeShortMagicLink({
        targetRoute: frontRoutes.assessment,
        lifetime: "short",
        extraQueryParams: { mtm_source: "assessment-reminder" },
      });
      const notification: NotificationContentAndFollowedIds = {
        kind: "email",
        templatedContent: {
          kind: "ASSESSMENT_AGENCY_NOTIFICATION",
          recipients: [email],
          sender: immersionFacileNoReplyEmailSender,
          params: {
            agencyReferentName: getFormattedFirstnameAndLastname(
              convention.agencyReferent ?? {},
            ),
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
            }),
            conventionId: convention.id,
            internshipKind: convention.internshipKind,
            businessName: convention.businessName,
            agencyLogoUrl: agency.logoUrl ?? undefined,
            assessmentCreationLink,
            tutorEmail: convention.establishmentTutor.email,
          },
        },
        followedIds: {
          agencyId: convention.agencyId,
          conventionId: convention.id,
          establishmentSiret: convention.siret,
        },
      };
      return saveNotificationAndRelatedEvent(uow, notification);
    }),
  );
};
