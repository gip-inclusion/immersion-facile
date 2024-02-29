import {
  ApiConsumer,
  SearchResultDto,
  SearchResultQuery,
  searchResultQuerySchema,
} from "shared";
import { NotFoundError } from "../../../config/helpers/httpErrors";
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
    if (!searchImmersionResultDto) {
      throw new NotFoundError(
        `No offer found for siret ${siret} and appellation code ${appellationCode}`,
      );
    }
    return searchImmersionResultDto;
  }
}
