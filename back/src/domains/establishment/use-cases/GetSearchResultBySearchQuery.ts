import {
  type ApiConsumer,
  errors,
  type SearchResultDto,
  type SearchResultQuery,
  searchResultQuerySchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

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

    const searchResult =
      await uow.establishmentAggregateRepository.getSearchResultBySearchQuery(
        siret,
        appellationCode,
        locationId,
      );
    if (!searchResult)
      throw errors.establishment.offerMissing({
        appellationCode,
        siret,
        mode: "not found",
      });

    return searchResult;
  }
}
