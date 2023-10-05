import {
  Group,
  GroupWithResults,
  WithGroupSlug,
  withGroupSlugSchema,
} from "shared";
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
    return uow.groupRepository.getGroupWithSearchResultsBySlug(groupSlug);
  }
}
