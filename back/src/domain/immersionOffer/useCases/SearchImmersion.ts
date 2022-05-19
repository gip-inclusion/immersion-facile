import promClient from "prom-client";
import { SearchImmersionQueryParamsDto } from "shared/src/searchImmersion/SearchImmersionQueryParams.dto";
import { searchImmersionQueryParamsSchema } from "shared/src/searchImmersion/SearchImmersionQueryParams.schema";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";
import { createLogger } from "../../../utils/logger";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { UseCase } from "../../core/UseCase";
import { ApiConsumer } from "../../core/valueObjects/ApiConsumer";
import { SearchMade, SearchMadeEntity } from "../entities/SearchMadeEntity";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";
import { SearchMadeRepository } from "../ports/SearchMadeRepository";

const logger = createLogger(__filename);

const histogramSearchImmersionStoredCount = new promClient.Histogram({
  name: "search_immersion_stored_result_count",
  help: "Histogram of the number of result returned from storage",
  buckets: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
});

export class SearchImmersion extends UseCase<
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto[],
  ApiConsumer
> {
  constructor(
    private readonly searchesMadeRepository: SearchMadeRepository,
    private readonly establishmentAggregateRepository: EstablishmentAggregateRepository,
    private readonly uuidGenerator: UuidGenerator,
  ) {
    super();
  }

  inputSchema = searchImmersionQueryParamsSchema;

  public async _execute(
    params: SearchImmersionQueryParamsDto,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto[]> {
    const apiConsumerName = apiConsumer?.consumer;

    const searchMade: SearchMade = {
      rome: params.rome,
      lat: params.latitude,
      lon: params.longitude,
      distance_km: params.distance_km,
      sortedBy: params.sortedBy,
      voluntaryToImmersion: params.voluntaryToImmersion,
    };

    const searchMadeEntity: SearchMadeEntity = {
      ...searchMade,
      id: this.uuidGenerator.new(),
      needsToBeSearched: true,
      apiConsumerName,
    };

    await this.searchesMadeRepository.insertSearchMade(searchMadeEntity);

    const dateStartQuery = new Date();
    const resultsFromStorage =
      await this.establishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
        {
          searchMade,
          withContactDetails: apiConsumerName !== undefined,
          maxResults: 100,
        },
      );
    const dateEndQuery = new Date();

    logger.debug(
      { duration_ms: dateEndQuery.getTime() - dateStartQuery.getTime() },
      "searchImmersionQueryDuration",
    );

    histogramSearchImmersionStoredCount.observe(resultsFromStorage.length);

    return resultsFromStorage;
  }
}
