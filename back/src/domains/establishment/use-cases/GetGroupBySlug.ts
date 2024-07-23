import {
  GroupWithResults,
  WithGroupSlug,
  errors,
  withGroupSlugSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

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
      throw errors.establishmentGroup.missingBySlug({ groupSlug });

    return groupWithResults;
  }
}
