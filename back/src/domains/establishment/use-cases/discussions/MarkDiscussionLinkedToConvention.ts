import { AddConventionInput, addConventionInputSchema } from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";

export class MarkDiscussionLinkedToConvention extends TransactionalUseCase<AddConventionInput> {
  inputSchema = addConventionInputSchema;

  async _execute(
    { convention, discussionId }: AddConventionInput,
    uow: UnitOfWork,
  ) {
    if (!discussionId) return;
    const discussion = await uow.discussionRepository.getById(discussionId);
    if (!discussion) return;
    if (discussion.siret !== convention.siret) return;
    await uow.discussionRepository.update({
      ...discussion,
      conventionId: convention.id,
    });
  }
}
