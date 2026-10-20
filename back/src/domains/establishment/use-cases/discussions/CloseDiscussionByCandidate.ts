import {
  type ConnectedUser,
  type DiscussionDto,
  type DiscussionStatus,
  errors,
  type WithDiscussionId,
  withDiscussionIdSchema,
} from "shared";
import type { CreateNewEvent } from "../../../core/events/ports/EventBus";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type CloseDiscussionByCandidate = ReturnType<
  typeof makeCloseDiscussionByCandidate
>;

const closableDiscussionStatus: DiscussionStatus = "PENDING";

export const makeCloseDiscussionByCandidate = useCaseBuilder(
  "CloseDiscussionByCandidate",
)
  .withInput<WithDiscussionId>(withDiscussionIdSchema)
  .withOutput<void>()
  .withCurrentUser<ConnectedUser>()
  .withDeps<{
    timeGateway: TimeGateway;
    createNewEvent: CreateNewEvent;
  }>()
  .build(async ({ inputParams: { discussionId }, uow, deps, currentUser }) => {
    const discussion = await uow.discussionRepository.getById(discussionId);
    if (!discussion) throw errors.discussion.notFound({ discussionId });

    if (discussion.potentialBeneficiary.email !== currentUser.email)
      throw errors.discussion.closeForbidden({
        discussionId,
        userId: currentUser.id,
      });

    if (discussion.status !== closableDiscussionStatus)
      throw errors.discussion.badStatus({
        discussionId,
        expectedStatus: closableDiscussionStatus,
      });

    const closedDiscussion: DiscussionDto = {
      ...discussion,
      status: "REJECTED",
      rejectionKind: "CLOSED_BY_CANDIDATE",
      updatedAt: deps.timeGateway.now().toISOString(),
    };

    await uow.discussionRepository.update(closedDiscussion);
    await uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "DiscussionStatusManuallyUpdated",
        payload: {
          discussion: closedDiscussion,
          triggeredBy: {
            kind: "connected-user",
            userId: currentUser.id,
          },
          skipSendingEmail: true,
        },
      }),
    );
  });
