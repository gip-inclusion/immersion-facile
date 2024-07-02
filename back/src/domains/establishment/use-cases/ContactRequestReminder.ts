import { addDays } from "date-fns";
import {
  DiscussionDto,
  createOpaqueEmail,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { z } from "zod";
import { createTransactionalUseCase } from "../../core/UseCase";
import {
  NotificationContentAndFollowedIds,
  SaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export type ContactRequestReminderMode = "3days" | "7days";
export type ContactRequestReminder = ReturnType<
  typeof makeContactRequestReminder
>;

const MAX_DISCUSSIONS = 5000;

export const makeContactRequestReminder = createTransactionalUseCase<
  ContactRequestReminderMode,
  number,
  undefined,
  {
    domain: string;
    timeGateway: TimeGateway;
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  }
>(
  { name: "ContactRequestReminder", inputSchema: z.enum(["3days", "7days"]) },
  async (mode, { uow, deps }, _) => {
    const now = deps.timeGateway.now();
    const discussions = await uow.discussionRepository.getDiscussions(
      {
        lastAnsweredByCandidate: {
          from: addDays(now, mode === "3days" ? -4 : -8),
          to: addDays(now, mode === "3days" ? -3 : -7),
        },
      },
      MAX_DISCUSSIONS,
    );

    const maybeNotifications = await Promise.all(
      discussions.map((discussion) =>
        makeNotification({ uow, discussion, mode, domain: deps.domain }),
      ),
    );

    const notifications = maybeNotifications.filter(
      (notifications): notifications is NotificationContentAndFollowedIds =>
        notifications !== null,
    );

    await Promise.all(
      notifications.map((notification) =>
        deps.saveNotificationAndRelatedEvent(uow, notification),
      ),
    );

    return notifications.length;
  },
);

const makeNotification = async ({
  uow,
  domain,
  mode,
  discussion,
}: {
  uow: UnitOfWork;
  domain: string;
  mode: ContactRequestReminderMode;
  discussion: DiscussionDto;
}): Promise<NotificationContentAndFollowedIds | null> => {
  const appelations =
    await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes([
      discussion.appellationCode,
    ]);
  const appelation = appelations.at(0);
  const replyTo = createOpaqueEmail(
    discussion.id,
    "potentialBeneficiary",
    `reply.${domain}`,
  );
  return appelation
    ? ({
        followedIds: { establishmentSiret: discussion.siret },
        kind: "email",
        templatedContent: {
          kind: "ESTABLISHMENT_CONTACT_REQUEST_REMINDER",
          params: {
            appelationLabel: appelation.appellationLabel,
            beneficiaryFirstName: discussion.potentialBeneficiary.firstName,
            beneficiaryLastName: discussion.potentialBeneficiary.lastName,
            beneficiaryReplyToEmail: replyTo,
            domain: domain,
            mode,
          },
          replyTo: {
            email: replyTo,
            name: `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
          },
          sender: immersionFacileNoReplyEmailSender,
          recipients: [discussion.establishmentContact.email],
        },
      } satisfies NotificationContentAndFollowedIds)
    : null;
};