import { GroupWithResults, WithGroupSlug, withGroupSlugSchema } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class GetOffersByGroupSlug extends TransactionalUseCase<
  WithGroupSlug,
  GroupWithResults
> {
  protected inputSchema = withGroupSlugSchema;

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  public async _execute(
    { groupSlug }: WithGroupSlug,
    uow: UnitOfWork,
  ): Promise<GroupWithResults> {
    const groupWithResults =
      await uow.groupRepository.getGroupWithSearchResultsBySlug(groupSlug);

    if (!groupWithResults)
      throw new NotFoundError(`Group with slug ${groupSlug} not found`);

    return groupWithResults;
  }
}
