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
  immersionFacileNoReplyEmailSender,
} from "shared";
import { z } from "zod";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import type { AssessmentRepository } from "../../convention/ports/AssessmentRepository";
import { createTransactionalUseCase } from "../../core/UseCase";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import type { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

type AssessmentReminderOutput = {
  numberOfReminders: number;
};

const allAssessmentReminderModes = [
  "3daysAfterInitialAssessmentEmail",
  "10daysAfterInitialAssessmentEmail",
] as const;
export type AssessmentReminderMode =
  (typeof allAssessmentReminderModes)[number];

export type AssessmentReminder = ReturnType<typeof makeAssessmentReminder>;
export const makeAssessmentReminder = createTransactionalUseCase<
  { mode: AssessmentReminderMode },
  AssessmentReminderOutput,
  void,
  {
    timeGateway: TimeGateway;
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  }
>(
  {
    name: "AssessmentReminder",
    inputSchema: z.object({
      mode: z.enum(allAssessmentReminderModes),
    }),
  },
  async ({ inputParams: params, uow, deps }) => {
    const now = deps.timeGateway.now();
    const conventionIdsToRemind = await getConventionIdsToRemind({
      mode: params.mode,
      now,
      assessmentRepository: uow.assessmentRepository,
      notificationRepository: uow.notificationRepository,
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
      });
    });

    return {
      numberOfReminders: conventionIdsToRemind.length,
    };
  },
);

const getConventionIdsToRemind = async ({
  mode,
  now,
  assessmentRepository,
  notificationRepository,
}: {
  mode: AssessmentReminderMode;
  now: Date;
  assessmentRepository: AssessmentRepository;
  notificationRepository: NotificationRepository;
}): Promise<ConventionId[]> => {
  const daysAfterLastNotifications =
    mode === "3daysAfterInitialAssessmentEmail" ? 3 : 10;

  const notificationSentToEstablishments =
    await notificationRepository.getEmailsByFilters({
      emailType: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
      createdAt: subDays(now, daysAfterLastNotifications),
    });

  const potentialConventionsToRemind = notificationSentToEstablishments
    .map((notification) => notification.followedIds.conventionId)
    .filter((conventionId) => conventionId !== undefined);

  const conventionsWithAssessments = (
    await assessmentRepository.getByConventionIds(potentialConventionsToRemind)
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
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        conventionId: convention.id,
        internshipKind: convention.internshipKind,
        establishmentTutorFirstName: convention.establishmentTutor.firstName,
        establishmentTutorLastName: convention.establishmentTutor.lastName,
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
}: {
  uow: UnitOfWork;
  saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  convention: ConventionReadDto;
  recipientEmail: Email;
  now: Date;
  generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
}) => {
  const assessmentCreationLink = generateConventionMagicLinkUrl({
    id: convention.id,
    email: recipientEmail,
    role: "establishment-tutor",
    targetRoute: frontRoutes.assessment,
    now,
  });
  const notification = createNotification({
    convention,
    recipientEmail: recipientEmail,
    assessmentCreationLink,
  });
  await saveNotificationAndRelatedEvent(uow, notification);
};
