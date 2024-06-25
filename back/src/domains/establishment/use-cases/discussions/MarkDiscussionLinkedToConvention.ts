import { AddConventionInput, addConventionInputSchema } from "shared";
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
      if (!discussion) return;
      if (discussion.siret !== convention.siret) return;
      await uow.discussionRepository.update({
        ...discussion,
        conventionId: convention.id,
      });
    },
  );
