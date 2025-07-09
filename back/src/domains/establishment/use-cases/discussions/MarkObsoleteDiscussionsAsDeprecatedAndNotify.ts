import { flatten } from "ramda";
import {
  type DiscussionDto,
  immersionFacileNoReplyEmailSender,
  isTruthy,
} from "shared";
import { z } from "zod";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationAndRelatedEvent,
} from "../../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { createTransactionalUseCase } from "../../../core/UseCase";

export type MarkObsoleteDiscussionsAsDeprecatedAndNotify = ReturnType<
  typeof makeMarkObsoleteDiscussionsAsDeprecatedAndNotify
>;

export const makeMarkObsoleteDiscussionsAsDeprecatedAndNotify =
  createTransactionalUseCase<
    void,
    { numberOfNotifications: number },
    void,
    {
      timeGateway: TimeGateway;
      saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    }
  >(
    {
      name: "MarkObsoleteDiscussionsAsDeprecatedAndNotify",
      inputSchema: z.void(),
    },
    async ({ uow, deps }) =>
      uow.discussionRepository
        .markObsoleteDiscussionsAsDeprecated({
          now: deps.timeGateway.now(),
        })
        .then((obsoleteDiscussions) =>
          Promise.all(
            obsoleteDiscussions.map((discussion) =>
              makeEstablishmentAndBeneficiaryNotifications({
                discussion,
              }),
            ),
          ),
        )
        .then(async (maybeNotifications) => {
          const notifications = maybeNotifications.filter(isTruthy);

          await Promise.all(
            flatten(notifications).map((notification) =>
              deps.saveNotificationAndRelatedEvent(uow, notification),
            ),
          );

          return { numberOfNotifications: notifications.length };
        }),
  );

const makeEstablishmentAndBeneficiaryNotifications = async ({
  discussion,
}: {
  discussion: DiscussionDto;
}): Promise<NotificationContentAndFollowedIds[]> => {
  return [
    {
      followedIds: {
        establishmentSiret: discussion.siret,
      },
      kind: "email",
      templatedContent: {
        kind: "DISCUSSION_DEPRECATED_NOTIFICATION_ESTABLISHMENT",
        params: {
          establishmentContactFirstName:
            discussion.establishmentContact.firstName ?? "",
          establishmentContactLastName:
            discussion.establishmentContact.lastName ?? "",
          businessName: discussion.businessName,
          discussionCreatedAt: discussion.createdAt,
          dashboardUrl: "TODO",
          beneficiaryFirstName: discussion.potentialBeneficiary.firstName,
          beneficiaryLastName: discussion.potentialBeneficiary.lastName,
        },
        recipients: [discussion.establishmentContact.email],
        sender: immersionFacileNoReplyEmailSender,
      },
    },
    {
      followedIds: {
        establishmentSiret: discussion.siret,
      },
      kind: "email",
      templatedContent: {
        kind: "DISCUSSION_DEPRECATED_NOTIFICATION_BENEFICIARY",
        params: {
          beneficiaryFirstName: discussion.potentialBeneficiary.firstName ?? "",
          beneficiaryLastName: discussion.potentialBeneficiary.lastName ?? "",
          businessName: discussion.businessName,
          discussionCreatedAt: discussion.createdAt,
          ctaUrl: "TODO",
        },
        recipients: [discussion.potentialBeneficiary.email],
        sender: immersionFacileNoReplyEmailSender,
      },
    },
  ];
};
