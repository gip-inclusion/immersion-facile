import {
  InclusionConnectedUser,
  RejectionKind,
  createOpaqueEmail,
  discussionIdSchema,
  discussionRejectionSchema,
  immersionFacileNoReplyEmailSender,
  rejectDiscussionEmailParams,
} from "shared";
import { z } from "zod";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../../config/helpers/httpErrors";
import { createTransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";

export type RejectDiscussionAndSendNotification = ReturnType<
  typeof makeRejectDiscussionAndSendNotification
>;
export const makeRejectDiscussionAndSendNotification =
  createTransactionalUseCase<
    {
      discussionId: string;
      rejectionKind: RejectionKind;
      rejectionReason?: string;
    },
    void,
    InclusionConnectedUser,
    {
      replyDomain: string;
      timeGateway: TimeGateway;
      saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
    }
  >(
    {
      name: "RejectDiscussionAndSendNotification",
      inputSchema: z
        .object({
          discussionId: discussionIdSchema,
        })
        .and(discussionRejectionSchema),
    },
    async (
      { discussionId, rejectionKind, rejectionReason },
      { uow, deps },
      currentUser,
    ) => {
      const discussion = await uow.discussionRepository.getById(discussionId);
      if (!discussion)
        throw new NotFoundError(`No discussion found with id: ${discussionId}`);

      if (currentUser.email !== discussion.establishmentContact.email) {
        throw new ForbiddenError(
          `User is not allowed to reject discussion ${discussionId}`,
        );
      }
      await uow.discussionRepository.update({
        ...discussion,
        status: "REJECTED",
        ...makeRejection(rejectionKind, rejectionReason),
      });

      await deps.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "DISCUSSION_EXCHANGE",
          sender: immersionFacileNoReplyEmailSender,
          params: rejectDiscussionEmailParams({
            discussion,
            rejectionKind,
            rejectionReason,
          }),
          recipients: [
            createOpaqueEmail(
              discussion.id,
              "potentialBeneficiary",
              deps.replyDomain,
            ),
          ],
          replyTo: {
            email: createOpaqueEmail(
              discussion.id,
              "establishment",
              deps.replyDomain,
            ),
            name: `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`,
          },
        },
        followedIds: {
          establishmentSiret: discussion.siret,
          userId: currentUser.id,
        },
      });
    },
  );

const makeRejection = (
  rejectionKind: RejectionKind,
  rejectionReason?: string,
) => {
  if (rejectionKind === "OTHER") {
    return {
      rejectionKind,
      rejectionReason: rejectionReason ?? "default rejection reason",
    };
  }
  return {
    rejectionKind,
  };
};
