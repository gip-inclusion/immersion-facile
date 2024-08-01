import { AddConventionInput, addConventionInputSchema, errors } from "shared";
import { createTransactionalUseCase } from "../../../core/UseCase";

export type MarkDiscussionLinkedToConvention = ReturnType<
  typeof makeMarkDiscussionLinkedToConvention
>;
export const makeMarkDiscussionLinkedToConvention =
  createTransactionalUseCase<AddConventionInput>(
    {
      name: "MarkDiscussionLinkedToConvention",
      inputSchema: addConventionInputSchema,
    },
    async ({ inputParams: { discussionId, convention }, uow }) => {
      if (!discussionId) return;
      const discussion = await uow.discussionRepository.getById(discussionId);
      if (!discussion) throw errors.discussion.notFound({ discussionId });
      await uow.discussionRepository.update({
        ...discussion,
        conventionId: convention.id,
        status: "ACCEPTED",
      });
    },
  );
