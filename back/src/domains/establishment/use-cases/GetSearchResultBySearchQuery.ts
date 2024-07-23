import {
  ApiConsumer,
  SearchResultDto,
  SearchResultQuery,
  errors,
  searchResultQuerySchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export class GetSearchResultBySearchQuery extends TransactionalUseCase<
  SearchResultQuery,
  SearchResultDto,
  ApiConsumer
> {
  protected inputSchema = searchResultQuerySchema;

  public async _execute(
    siretAndAppellationDto: SearchResultQuery,
    uow: UnitOfWork,
  ): Promise<SearchResultDto> {
    const { siret, appellationCode, locationId } = siretAndAppellationDto;

    const searchImmersionResultDto =
      await uow.establishmentAggregateRepository.getSearchImmersionResultDtoBySearchQuery(
        siret,
        appellationCode,
        locationId,
      );
    if (!searchImmersionResultDto)
      throw errors.establishment.immersionOfferNotFound({
        appellationCode,
        siret,
      });

    return searchImmersionResultDto;
  }
}
