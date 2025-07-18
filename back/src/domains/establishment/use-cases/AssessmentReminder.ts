import subDays from "date-fns/subDays";
import { difference } from "ramda";
import {
  type AbsoluteUrl,
  type ConventionId,
  type ConventionReadDto,
  type Email,
  errors,
  executeInSequence,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { z } from "zod";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
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
  numberOfReminders: number;
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
      mode: z.enum(allAssessmentReminderModes),
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
        recipientEmail: convention.establishmentTutor.email,
        convention,
        now,
        generateConventionMagicLinkUrl: deps.generateConventionMagicLinkUrl,
        saveNotificationAndRelatedEvent: deps.saveNotificationAndRelatedEvent,
        shortLinkIdGeneratorGateway: deps.shortLinkIdGeneratorGateway,
        config: deps.config,
      });
    });

    return {
      numberOfReminders: conventionIdsToRemind.length,
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

const createNotification = ({
  convention,
  recipientEmail,
  assessmentCreationLink,
}: {
  convention: ConventionReadDto;
  recipientEmail: Email;
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
      recipients: [recipientEmail],
      sender: immersionFacileNoReplyEmailSender,
    },
  };
};

const sendAssessmentReminders = async ({
  uow,
  saveNotificationAndRelatedEvent,
  convention,
  recipientEmail,
  now,
  generateConventionMagicLinkUrl,
  shortLinkIdGeneratorGateway,
  config,
}: {
  uow: UnitOfWork;
  saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  convention: ConventionReadDto;
  recipientEmail: Email;
  now: Date;
  generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
  config: AppConfig;
}) => {
  const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
    config,
    conventionMagicLinkPayload: {
      id: convention.id,
      email: recipientEmail,
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

  const notification = createNotification({
    convention,
    recipientEmail: recipientEmail,
    assessmentCreationLink,
  });
  await saveNotificationAndRelatedEvent(uow, notification);
};
