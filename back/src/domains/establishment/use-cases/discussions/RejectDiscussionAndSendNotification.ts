import {
  type DiscussionDto,
  type InclusionConnectedUser,
  RejectDiscussionAndSendNotificationParam,
  createOpaqueEmail,
  discussionIdSchema,
  discussionRejectionSchema,
  errors,
  immersionFacileNoReplyEmailSender,
  rejectDiscussionEmailParams,
} from "shared";
import { z } from "zod";
import { createTransactionalUseCase } from "../../../core/UseCase";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";

export type RejectDiscussionAndSendNotification = ReturnType<
  typeof makeRejectDiscussionAndSendNotification
>;

export const makeRejectDiscussionAndSendNotification =
  createTransactionalUseCase<
    RejectDiscussionAndSendNotificationParam,
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
    async ({ inputParams, uow, deps, currentUser }) => {
      const discussion = await uow.discussionRepository.getById(
        inputParams.discussionId,
      );
      if (!discussion)
        throw errors.discussion.notFound({
          discussionId: inputParams.discussionId,
        });

      if (discussion.status === "REJECTED")
        throw errors.discussion.alreadyRejected({
          discussionId: discussion.id,
        });

      if (!userHasRights(currentUser, discussion))
        throw errors.discussion.rejectForbidden({
          discussionId: discussion.id,
          userId: currentUser.id,
        });

      const { htmlContent, subject } = rejectDiscussionEmailParams(
        inputParams,
        discussion,
      );

      await uow.discussionRepository.update({
        ...discussion,
        status: "REJECTED",
        ...(inputParams.rejectionKind === "OTHER"
          ? {
              rejectionKind: inputParams.rejectionKind,
              rejectionReason: inputParams.rejectionReason,
            }
          : {
              rejectionKind: inputParams.rejectionKind,
            }),
        exchanges: [
          ...discussion.exchanges,
          {
            subject,
            message: htmlContent,
            sender: "establishment",
            recipient: "potentialBeneficiary",
            sentAt: deps.timeGateway.now().toISOString(),
            attachments: [],
          },
        ],
      });

      await deps.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "DISCUSSION_EXCHANGE",
          sender: immersionFacileNoReplyEmailSender,
          params: { htmlContent, subject },
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

const userHasRights = (
  currentUser: InclusionConnectedUser,
  discussion: DiscussionDto,
) => {
  return currentUser.email === discussion.establishmentContact.email;
};
