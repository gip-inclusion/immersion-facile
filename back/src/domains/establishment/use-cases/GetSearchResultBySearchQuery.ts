import {
  type ApiConsumer,
  errors,
  type InternalOfferDto,
  type SearchResultQuery,
  searchResultQuerySchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export class GetSearchResultBySearchQuery extends TransactionalUseCase<
  SearchResultQuery,
  InternalOfferDto,
  ApiConsumer
> {
  protected inputSchema = searchResultQuerySchema;

  public async _execute(
    { siret, appellationCode, locationId }: SearchResultQuery,
    uow: UnitOfWork,
  ): Promise<InternalOfferDto> {
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
