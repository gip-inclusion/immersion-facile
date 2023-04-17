import {
  ApiConsumer,
  SearchImmersionQueryParamsDto,
  searchImmersionQueryParamsSchema,
  SearchImmersionResultDto,
} from "shared";
import { histogramSearchImmersionStoredCount } from "../../../utils/counters";
import { createLogger } from "../../../utils/logger";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import { SearchMade, SearchMadeEntity } from "../entities/SearchMadeEntity";

const logger = createLogger(__filename);

export class SearchImmersion extends TransactionalUseCase<
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto[],
  ApiConsumer
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly uuidGenerator: UuidGenerator,
  ) {
    super(uowPerformer);
  }

  inputSchema = searchImmersionQueryParamsSchema;

  public async _execute(
    params: SearchImmersionQueryParamsDto,
    uow: UnitOfWork,
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
      place: params.place,
    };

    const searchMadeEntity: SearchMadeEntity = {
      ...searchMade,
      id: this.uuidGenerator.new(),
      needsToBeSearched: true,
      apiConsumerName,
    };

    await uow.searchMadeRepository.insertSearchMade(searchMadeEntity);

    const resultsFromStorage =
      await uow.establishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
        {
          searchMade,
          withContactDetails: false,
          maxResults: 100,
        },
      );

    histogramSearchImmersionStoredCount.observe(resultsFromStorage.length);
    logger.info(
      { resultsFromStorage: resultsFromStorage.length },
      "searchImmersionStored",
    );

    return resultsFromStorage;
  }
}
