import promClient from "prom-client";
import {
  SearchImmersionRequestDto,
  searchImmersionRequestSchema,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { UseCase } from "../../core/UseCase";
import { ApiConsumer } from "../../core/valueObjects/ApiConsumer";
import { SearchMade, SearchMadeEntity } from "../entities/SearchMadeEntity";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { SearchMadeRepository } from "../ports/SearchMadeRepository";

const histogramSearchImmersionStoredCount = new promClient.Histogram({
  name: "search_immersion_stored_result_count",
  help: "Histogram of the number of result returned from storage",
  buckets: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
});

export class SearchImmersion extends UseCase<
  SearchImmersionRequestDto,
  SearchImmersionResultDto[],
  ApiConsumer
> {
  constructor(
    private readonly searchesMadeRepository: SearchMadeRepository,
    private readonly immersionOfferRepository: ImmersionOfferRepository,
    private readonly uuidGenerator: UuidGenerator,
  ) {
    super();
  }

  inputSchema = searchImmersionRequestSchema;

  public async _execute(
    params: SearchImmersionRequestDto,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto[]> {
    const searchMade: SearchMade = {
      rome: params.rome,
      lat: params.location.lat,
      lon: params.location.lon,
      distance_km: params.distance_km,
    };
    const searchMadeEntity: SearchMadeEntity = {
      ...searchMade,
      id: this.uuidGenerator.new(),
      needsToBeSearched: true,
    };
    await this.searchesMadeRepository.insertSearchMade(searchMadeEntity);
    const apiConsumerName = apiConsumer?.consumer;

    const resultsFromStorage =
      await this.immersionOfferRepository.getSearchImmersionResultDtoFromSearchMade(
        {
          searchMade,
          withContactDetails: apiConsumerName !== undefined,
          maxResults: 100,
        },
      );

    histogramSearchImmersionStoredCount.observe(resultsFromStorage.length);

    return resultsFromStorage;
  }
}
