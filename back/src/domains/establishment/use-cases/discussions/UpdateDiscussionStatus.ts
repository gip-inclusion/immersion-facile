import {
  type ConnectedUser,
  type DiscussionDto,
  discussionIdSchema,
  type EstablishmentRole,
  errors,
  rejectDiscussionEmailParams,
  type SiretDto,
  type UpdateDiscussionStatusParams,
  type UserId,
  withDiscussionStatusSchema,
} from "shared";
import { match } from "ts-pattern";
import { z } from "zod";
import type { CreateNewEvent } from "../../../core/events/ports/EventBus";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type UpdateDiscussionStatus = ReturnType<
  typeof makeUpdateDiscussionStatus
>;

export const makeUpdateDiscussionStatus = useCaseBuilder(
  "UpdateDiscussionStatus",
)
  .withInput<UpdateDiscussionStatusParams>(
    z
      .object({
        discussionId: discussionIdSchema,
      })
      .and(withDiscussionStatusSchema),
  )
  .withDeps<{
    timeGateway: TimeGateway;
    createNewEvent: CreateNewEvent;
  }>()
  .withCurrentUser<ConnectedUser>()
  .build(async ({ inputParams, uow, deps, currentUser }) => {
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
        currentUserId: currentUser.id,
        siret: discussion.siret,
      }))
    )
      throw errors.discussion.rejectForbidden({
        discussionId: discussion.id,
        userId: currentUser.id,
      });

    if (discussion.status === "REJECTED")
      throw errors.discussion.alreadyRejected({
        discussionId: discussion.id,
      });

    const updatedDiscussion = await updateDiscussion({
      inputParams,
      discussion,
      currentUser,
      timeGateway: deps.timeGateway,
      uow,
    });

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
              userId: currentUser.id,
            },
            ...(shouldSkipSendingEmail() ? { skipSendingEmail: true } : {}),
          },
        }),
      ),
    ]);
  });

const userHasRights = async ({
  uow,
  currentUserId,
  siret,
}: {
  uow: UnitOfWork;
  currentUserId: UserId;
  siret: SiretDto;
}) => {
  const establishment =
    await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
      siret,
    );
  if (!establishment) throw errors.establishment.notFound({ siret });
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

const updateDiscussion = async ({
  inputParams,
  discussion,
  currentUser,
  timeGateway,
  uow,
}: {
  inputParams: UpdateDiscussionStatusParams;
  discussion: DiscussionDto;
  currentUser: ConnectedUser;
  timeGateway: TimeGateway;
  uow: UnitOfWork;
}): Promise<DiscussionDto> => {
  const updatedDiscussionByStatus = await match<
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
        currentUser,
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
            email: currentUser.email,
            firstname: currentUser.firstName,
            lastname: currentUser.lastName,
            sentAt: timeGateway.now().toISOString(),
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

  return {
    ...updatedDiscussionByStatus,
    updatedAt: timeGateway.now().toISOString(),
  };
};
