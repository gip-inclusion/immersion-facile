import {
  type AddConventionInput,
  addConventionInputSchema,
  errors,
} from "shared";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../../core/useCaseBuilder";

export type MarkDiscussionLinkedToConvention = ReturnType<
  typeof makeMarkDiscussionLinkedToConvention
>;
export const makeMarkDiscussionLinkedToConvention = useCaseBuilder(
  "MarkDiscussionLinkedToConvention",
)
  .withInput<AddConventionInput>(addConventionInputSchema)
  .withOutput<void>()
  .withCurrentUser<void>()
  .withDeps<{ timeGateway: TimeGateway }>()
  .build(async ({ inputParams: { discussionId, convention }, uow, deps }) => {
    if (!discussionId) return;
    const discussion = await uow.discussionRepository.getById(discussionId);
    if (!discussion) throw errors.discussion.notFound({ discussionId });
    await uow.discussionRepository.update({
      ...discussion,
      updatedAt: deps.timeGateway.now().toISOString(),
      conventionId: convention.id,
      status: "ACCEPTED",
      candidateWarnedMethod: null,
    });
  });
