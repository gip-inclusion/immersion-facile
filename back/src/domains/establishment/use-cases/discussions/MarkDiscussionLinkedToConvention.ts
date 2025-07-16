import {
  type AddConventionInput,
  addConventionInputSchema,
  errors,
} from "shared";
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

  .build(async ({ inputParams: { discussionId, convention }, uow }) => {
    if (!discussionId) return;
    const discussion = await uow.discussionRepository.getById(discussionId);
    if (!discussion) throw errors.discussion.notFound({ discussionId });
    await uow.discussionRepository.update({
      ...discussion,
      conventionId: convention.id,
      status: "ACCEPTED",
      candidateWarnedMethod: null,
    });
  });
