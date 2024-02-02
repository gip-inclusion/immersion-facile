import { GroupWithResults, WithGroupSlug, withGroupSlugSchema } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";

export class GetOffersByGroupSlug extends TransactionalUseCase<
  WithGroupSlug,
  GroupWithResults
> {
  protected inputSchema = withGroupSlugSchema;

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
