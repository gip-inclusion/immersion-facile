import {
  type ConnectedUser,
  type DiscussionDto,
  discussionIdSchema,
  type Email,
  type EstablishmentRole,
  errors,
  rejectDiscussionEmailParams,
  type UpdateDiscussionStatusParams,
  type UserId,
  withDiscussionStatusSchema,
} from "shared";
import { match } from "ts-pattern";
import { z } from "zod";
import type { CreateNewEvent } from "../../../core/events/ports/EventBus";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { createTransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";

export type UpdateDiscussionStatus = ReturnType<
  typeof makeUpdateDiscussionStatus
>;

export const makeUpdateDiscussionStatus = createTransactionalUseCase<
  UpdateDiscussionStatusParams,
  void,
  ConnectedUser,
  {
    timeGateway: TimeGateway;
    createNewEvent: CreateNewEvent;
  }
>(
  {
    name: "UpdateDiscussionStatus",
    inputSchema: z
      .object({
        discussionId: discussionIdSchema,
      })
      .and(withDiscussionStatusSchema),
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

    if (discussion.status === "REJECTED")
      throw errors.discussion.alreadyRejected({
        discussionId: discussion.id,
      });

    const updatedDiscussion = await match<
      UpdateDiscussionStatusParams,
      Promise<DiscussionDto>
    >(inputParams)
      .with({ status: "REJECTED" }, async (params) => {
        if (params.rejectionKind === "CANDIDATE_ALREADY_WARNED") {
          return {
            ...discussion,
            status: "REJECTED",
            rejectionKind: "CANDIDATE_ALREADY_WARNED",
            candidateWarnedMethod: params.candidateWarnedMethod,
          };
        }

        const { htmlContent, subject } = rejectDiscussionEmailParams(
          params,
          discussion,
        );

        return {
          ...discussion,
          status: "REJECTED",
          ...(params.rejectionKind === "OTHER"
            ? {
                rejectionKind: params.rejectionKind,
                rejectionReason: params.rejectionReason,
              }
            : {
                rejectionKind: params.rejectionKind,
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
      })
      .with({ status: "ACCEPTED" }, async (params) => {
        if (params.conventionId) {
          const convention = await uow.conventionRepository.getById(
            params.conventionId,
          );
          if (!convention)
            throw errors.convention.notFound({
              conventionId: params.conventionId,
            });
        }
        return {
          ...discussion,
          status: "ACCEPTED",
          candidateWarnedMethod: params.candidateWarnedMethod,
          conventionId: params.conventionId,
        };
      })
      .with({ status: "PENDING" }, () => {
        throw new Error(
          `Le passage d'une discussion à l'état PENDING n'est pas supporté. (DiscussionID : ${discussion.id})`,
        );
      })
      .exhaustive();

    const shouldSkipSendingEmail = () => {
      if (updatedDiscussion.status === "ACCEPTED") return true;
      if (updatedDiscussion.status === "REJECTED") {
        return updatedDiscussion.rejectionKind === "CANDIDATE_ALREADY_WARNED";
      }
      return false;
    };

    await Promise.all([
      uow.discussionRepository.update(updatedDiscussion),
      uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "DiscussionStatusManuallyUpdated",
          payload: {
            discussion: updatedDiscussion,
            triggeredBy: {
              kind: "connected-user",
              userId,
            },
            ...(shouldSkipSendingEmail() ? { skipSendingEmail: true } : {}),
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
