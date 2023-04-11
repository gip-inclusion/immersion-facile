import {
  SearchImmersionResultDto,
  WithEstablishmentGroupSlug,
  withEstablishmentGroupSlugSchema,
} from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class GetOffersByGroupSlug extends TransactionalUseCase<
  WithEstablishmentGroupSlug,
  SearchImmersionResultDto[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = withEstablishmentGroupSlugSchema;

  public async _execute(
    { groupSlug }: WithEstablishmentGroupSlug,
    uow: UnitOfWork,
  ): Promise<SearchImmersionResultDto[]> {
    return uow.establishmentGroupRepository.findSearchImmersionResultsBySlug(
      groupSlug,
    );
  }
}
