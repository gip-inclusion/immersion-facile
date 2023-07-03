import { prop } from "ramda";
import {
  ApiConsumer,
  SearchImmersionParamsDto,
  searchImmersionParamsSchema,
  SearchImmersionResultDto,
  SiretDto,
} from "shared";
import { histogramSearchImmersionStoredCount } from "../../../utils/counters";
import { createLogger } from "../../../utils/logger";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import { SearchMade, SearchMadeEntity } from "../entities/SearchMadeEntity";
import { LaBonneBoiteGateway } from "../ports/LaBonneBoiteGateway";

const logger = createLogger(__filename);

export class SearchImmersion extends TransactionalUseCase<
  SearchImmersionParamsDto,
  SearchImmersionResultDto[],
  ApiConsumer
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly laBonneBoiteAPI: LaBonneBoiteGateway,
    private readonly uuidGenerator: UuidGenerator,
  ) {
    super(uowPerformer);
  }

  inputSchema = searchImmersionParamsSchema;

  public async _execute(
    params: SearchImmersionParamsDto,
    uow: UnitOfWork,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto[]> {
    const apiConsumerName = apiConsumer?.consumer;

    const searchMade: SearchMade = {
      rome: params.rome,
      lat: params.latitude,
      lon: params.longitude,
      distance_km: params.distanceKm,
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

    const lbbSearchResults = [
      ...(shouldFetchLBB(params.rome, params.voluntaryToImmersion)
        ? await this.laBonneBoiteAPI.searchCompanies({
            rome: params.rome,
            lat: params.latitude,
            lon: params.longitude,
            distanceKm: params.distanceKm,
          })
        : []),
    ];

    if (params.voluntaryToImmersion === false) return lbbSearchResults;

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

    const isSiretAlreadyInStoredResults = <T extends { siret: SiretDto }>({
      siret,
    }: T) => !resultsFromStorage.map(prop("siret")).includes(siret);

    return [
      ...resultsFromStorage,
      ...lbbSearchResults.filter(isSiretAlreadyInStoredResults),
    ];
  }
}

const shouldFetchLBB = (
  rome: string | undefined,
  voluntaryToImmersion?: boolean | undefined,
): rome is string => !!rome && voluntaryToImmersion !== true;
