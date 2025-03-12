import {
  type DiscussionDto,
  type Exchange,
  type InclusionConnectedUser,
  type RejectionKind,
  createOpaqueEmail,
  discussionIdSchema,
  discussionRejectionSchema,
  errors,
  immersionFacileNoReplyEmailSender,
  makeRejection,
  rejectDiscussionEmailParams,
} from "shared";
import { z } from "zod";
import { createTransactionalUseCase } from "../../../core/UseCase";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { addExchangeToDiscussion } from "../../helpers/discussion.helpers";

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
    async ({
      inputParams: { discussionId, rejectionKind, rejectionReason },
      uow,
      deps,
      currentUser,
    }) => {
      const discussion = await uow.discussionRepository.getById(discussionId);
      if (!discussion) throw errors.discussion.notFound({ discussionId });

      if (discussion.status === "REJECTED")
        throw errors.discussion.alreadyRejected({ discussionId });

      if (currentUser.email !== discussion.establishmentContact.email)
        throw errors.discussion.rejectForbidden({
          discussionId,
          userId: currentUser.id,
        });

      const updatedDiscussion: DiscussionDto = {
        ...discussion,
        status: "REJECTED",
        ...makeRejection({ rejectionKind, rejectionReason }),
      };

      const emailParams = rejectDiscussionEmailParams({
        discussion,
        rejectionKind,
        rejectionReason,
      });

      const exchange: Exchange = {
        subject: emailParams.subject,
        message: emailParams.htmlContent,
        sender: "establishment",
        recipient: "potentialBeneficiary",
        sentAt: deps.timeGateway.now().toISOString(),
        attachments: [],
      };

      await uow.discussionRepository.update(
        addExchangeToDiscussion(updatedDiscussion, exchange),
      );

      await deps.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "DISCUSSION_EXCHANGE",
          sender: immersionFacileNoReplyEmailSender,
          params: emailParams,
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
