import {
  type DiscussionDto,
  type Email,
  type EstablishmentRole,
  type InclusionConnectedUser,
  type RejectDiscussionAndSendNotificationParam,
  type UserId,
  createOpaqueEmail,
  discussionIdSchema,
  discussionRejectionSchema,
  errors,
  immersionFacileNoReplyEmailSender,
  rejectDiscussionEmailParams,
} from "shared";
import { z } from "zod/v4";
import { createTransactionalUseCase } from "../../../core/UseCase";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";

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
    async ({
      inputParams,
      uow,
      deps,
      currentUser: { id: userId, email: userEmail },
    }) => {
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

      if (
        !(await userHasRights({
          uow,
          currentUserId: userId,
          currentUserEmail: userEmail,
          discussion,
        }))
      )
        throw errors.discussion.rejectForbidden({
          discussionId: discussion.id,
          userId,
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
            createOpaqueEmail({
              discussionId: discussion.id,
              recipient: {
                kind: "potentialBeneficiary",
                firstname: discussion.potentialBeneficiary.firstName,
                lastname: discussion.potentialBeneficiary.lastName,
              },
              replyDomain: deps.replyDomain,
            }),
          ],
          replyTo: {
            email: createOpaqueEmail({
              discussionId: discussion.id,
              recipient: {
                kind: "establishment",
                firstname: discussion.establishmentContact.firstName,
                lastname: discussion.establishmentContact.lastName,
              },
              replyDomain: deps.replyDomain,
            }),
            name: `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`,
          },
        },
        followedIds: {
          establishmentSiret: discussion.siret,
          userId,
        },
      });
    },
  );

const userHasRights = async ({
  uow,
  currentUserId,
  currentUserEmail,
  discussion,
}: {
  uow: UnitOfWork;
  currentUserId: UserId;
  currentUserEmail: Email;
  discussion: DiscussionDto;
}) => {
  if (discussion.establishmentContact.email === currentUserEmail) return true;
  if (discussion.establishmentContact.copyEmails.includes(currentUserEmail))
    return true;

  const establishment =
    await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
      discussion.siret,
    );
  if (!establishment)
    throw errors.establishment.notFound({ siret: discussion.siret });

  if (
    establishment.userRights.some(
      ({ role, userId }) =>
        allowedEstablishmentRolesForRejection.includes(role) &&
        userId === currentUserId,
    )
  )
    return true;
  return false;
};

const allowedEstablishmentRolesForRejection: EstablishmentRole[] = [
  "establishment-admin",
  "establishment-contact",
];
