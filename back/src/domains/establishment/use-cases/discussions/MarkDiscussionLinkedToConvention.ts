import { AddConventionInput, addConventionInputSchema } from "shared";
import { NotFoundError } from "shared";
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
    async ({ discussionId, convention }, { uow }) => {
      if (!discussionId) return;
      const discussion = await uow.discussionRepository.getById(discussionId);
      if (!discussion)
        throw new NotFoundError(`No discussion found with id: ${discussionId}`);
      await uow.discussionRepository.update({
        ...discussion,
        conventionId: convention.id,
        status: "ACCEPTED",
      });
    },
  );
