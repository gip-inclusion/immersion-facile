import { SearchImmersionResultDto } from "shared";
import { zString } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { ApiConsumer } from "shared";

export class GetImmersionOfferById extends TransactionalUseCase<
  string,
  SearchImmersionResultDto,
  ApiConsumer
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = zString;

  public async _execute(
    immersionOfferId: string,
    uow: UnitOfWork,
    apiConsumer?: ApiConsumer,
  ): Promise<SearchImmersionResultDto> {
    const [siret, romeCode] = immersionOfferId.split("-");
    const searchImmersionResultDto =
      await uow.establishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndRome(
        siret,
        romeCode,
      );
    if (!searchImmersionResultDto) throw new NotFoundError(immersionOfferId);

    return {
      ...searchImmersionResultDto,
      contactDetails: apiConsumer
        ? searchImmersionResultDto.contactDetails
        : undefined,
    };
  }
}
