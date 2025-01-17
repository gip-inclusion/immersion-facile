import subDays from "date-fns/subDays";
import { difference } from "ramda";
import {
  AbsoluteUrl,
  AgencyRole,
  ConventionId,
  ConventionReadDto,
  Email,
  EmailNotification,
  errors,
  frontRoutes,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { z } from "zod";
import { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import { AssessmentRepository } from "../../convention/ports/AssessmentRepository";
import { createTransactionalUseCase } from "../../core/UseCase";
import {
  NotificationContentAndFollowedIds,
  SaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

type AssessmentReminderOutput = {
  numberOfFirstReminders: number;
};

export type AssessmentReminderMode = "3daysAfterConventionEnd";

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
    inputSchema: z.object({ mode: z.enum(["3daysAfterConventionEnd"]) }),
  },
  async ({ inputParams: params, uow, deps }) => {
    const now = deps.timeGateway.now();
    const conventionIdsToRemind = await getConventionIdsToRemind({
      mode: params.mode,
      now,
      assessmentRepository: uow.assessmentRepository,
      notificationRepository: uow.notificationRepository,
    });

    await Promise.all(
      conventionIdsToRemind.map(async (conventionId) => {
        const convention =
          await uow.conventionQueries.getConventionById(conventionId);
        if (!convention)
          throw errors.convention.notFound({ conventionId: conventionId });
        await sendAssessmentReminders({
          uow,
          recipientEmails: convention.agencyValidatorEmails,
          convention,
          now,
          generateConventionMagicLinkUrl: deps.generateConventionMagicLinkUrl,
          saveNotificationAndRelatedEvent: deps.saveNotificationAndRelatedEvent,
          role: "validator",
        });
        await sendAssessmentReminders({
          uow,
          recipientEmails: convention.agencyCounsellorEmails,
          convention,
          now,
          generateConventionMagicLinkUrl: deps.generateConventionMagicLinkUrl,
          saveNotificationAndRelatedEvent: deps.saveNotificationAndRelatedEvent,
          role: "counsellor",
        });
      }),
    );

    return Promise.resolve({
      numberOfFirstReminders: conventionIdsToRemind.length,
    });
  },
);

const getConventionIdsToRemind = async ({
  mode,
  now,
  notificationRepository,
  assessmentRepository,
}: {
  mode: AssessmentReminderMode;
  now: Date;
  notificationRepository: NotificationRepository;
  assessmentRepository: AssessmentRepository;
}): Promise<ConventionId[]> => {
  const daysAfterLastNotifications =
    mode === "3daysAfterConventionEnd" ? 4 : 11; //assessment notification is sent one day before convention ends
  const potentialAssessmentsToRemind =
    await notificationRepository.getEmailsByKindAndAroundCreatedAt(
      "ASSESSMENT_AGENCY_NOTIFICATION",
      subDays(now, daysAfterLastNotifications),
    );
  const conventionIds: ConventionId[] = potentialAssessmentsToRemind
    .filter(
      (
        assessmentEmail,
      ): assessmentEmail is EmailNotification & {
        templatedContent: { params: { conventionId: ConventionId } };
      } => "conventionId" in assessmentEmail.templatedContent.params,
    )
    .map(
      (assessmentEmail) => assessmentEmail.templatedContent.params.conventionId,
    );

  const conventionsWithAssessments = (
    await assessmentRepository.getByConventionIds(conventionIds)
  ).map((assessment) => assessment.conventionId);

  return difference(conventionIds, conventionsWithAssessments);
};

const createNotification = ({
  convention,
  recipientEmail,
  establishmentContactEmail,
  assessmentCreationLink,
}: {
  convention: ConventionReadDto;
  recipientEmail: Email;
  establishmentContactEmail: Email;
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
      kind: "ASSESSMENT_AGENCY_FIRST_REMINDER",
      params: {
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        conventionId: convention.id,
        internshipKind: convention.internshipKind,
        businessName: convention.businessName,
        assessmentCreationLink,
        establishmentContactEmail,
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
  recipientEmails,
  now,
  generateConventionMagicLinkUrl,
  role,
}: {
  uow: UnitOfWork;
  saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  convention: ConventionReadDto;
  recipientEmails: Email[];
  now: Date;
  generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  role: AgencyRole;
}) => {
  for (const recipientEmail of recipientEmails) {
    const assessmentCreationLink = generateConventionMagicLinkUrl({
      id: convention.id,
      email: recipientEmail,
      role,
      targetRoute: frontRoutes.assessment,
      now,
    });
    const notification = createNotification({
      convention,
      recipientEmail: recipientEmail,
      establishmentContactEmail:
        convention.signatories.establishmentRepresentative.email,
      assessmentCreationLink,
    });
    await saveNotificationAndRelatedEvent(uow, notification);
  }
};
