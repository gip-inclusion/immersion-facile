import {
  SearchResultDto,
  WithEstablishmentGroupSlug,
  withEstablishmentGroupSlugSchema,
} from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class GetOffersByGroupSlug extends TransactionalUseCase<
  WithEstablishmentGroupSlug,
  SearchResultDto[]
> {
  protected inputSchema = withEstablishmentGroupSlugSchema;

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  public async _execute(
    { groupSlug }: WithEstablishmentGroupSlug,
    uow: UnitOfWork,
  ): Promise<SearchResultDto[]> {
    return uow.establishmentGroupRepository.findSearchImmersionResultsBySlug(
      groupSlug,
    );
  }
}
