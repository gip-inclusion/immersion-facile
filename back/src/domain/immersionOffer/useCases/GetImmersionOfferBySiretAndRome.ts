import { SearchImmersionResultDto } from "shared";
import { SiretAndRomeDto } from "shared";
import { siretAndRomeSchema } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { ApiConsumer } from "../../core/valueObjects/ApiConsumer";

export class GetImmersionOfferBySiretAndRome extends TransactionalUseCase<
  SiretAndRomeDto,
  SearchImmersionResultDto,
  ApiConsumer
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = siretAndRomeSchema;

  public async _execute(
    siretAndRomeDto: SiretAndRomeDto,
    uow: UnitOfWork,
  ): Promise<SearchImmersionResultDto> {
    const { siret, rome } = siretAndRomeDto;

    const searchImmersionResultDto =
      await uow.establishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndRome(
        siret,
        rome,
      );

    if (!searchImmersionResultDto)
      throw new NotFoundError(
        `No offer found for siret ${siret} and rome ${rome}`,
      );
    return searchImmersionResultDto;
  }
}
