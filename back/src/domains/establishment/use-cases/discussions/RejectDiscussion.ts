import {
  type DiscussionDto,
  type Email,
  type EstablishmentRole,
  type InclusionConnectedUser,
  type RejectDiscussionAndSendNotificationParam,
  type UserId,
  discussionIdSchema,
  discussionRejectionSchema,
  errors,
  rejectDiscussionEmailParams,
} from "shared";
import { z } from "zod";
import { createTransactionalUseCase } from "../../../core/UseCase";
import type { CreateNewEvent } from "../../../core/events/ports/EventBus";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";

export type RejectDiscussion = ReturnType<typeof makeRejectDiscussion>;

export const makeRejectDiscussion = createTransactionalUseCase<
  RejectDiscussionAndSendNotificationParam,
  void,
  InclusionConnectedUser,
  {
    timeGateway: TimeGateway;
    createNewEvent: CreateNewEvent;
  }
>(
  {
    name: "RejectDiscussion",
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

    const updatedDiscussion: DiscussionDto = {
      ...discussion,
      status: "REJECTED",
      candidateWarnedMethod: inputParams.candidateWarnedMethod,
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
    };

    await Promise.all([
      uow.discussionRepository.update(updatedDiscussion),
      uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "DiscussionRejected",
          payload: {
            discussion: updatedDiscussion,
            triggeredBy: {
              kind: "inclusion-connected",
              userId,
            },
          },
        }),
      ),
    ]);
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
