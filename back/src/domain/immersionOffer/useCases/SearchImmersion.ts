import { filter, map, prop } from "ramda";
import {
  ApiConsumer,
  pipeWithValue,
  SearchImmersionQueryParamsDto,
  searchImmersionQueryParamsSchema,
  SearchImmersionResultDto,
  SiretDto,
} from "shared";
import { histogramSearchImmersionStoredCount } from "../../../utils/counters";
import { createLogger } from "../../../utils/logger";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import { SearchMade, SearchMadeEntity } from "../entities/SearchMadeEntity";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteRequestParams,
} from "../ports/LaBonneBoiteAPI";
import { LaBonneBoiteCompanyVO } from "../valueObjects/LaBonneBoiteCompanyVO";

const logger = createLogger(__filename);

export class SearchImmersion extends TransactionalUseCase<
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto[],
  ApiConsumer
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly laBonneBoiteAPI: LaBonneBoiteAPI,
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

    const lbbSearchResults = shouldFetchLBB(
      params.rome,
      params.voluntaryToImmersion,
    )
      ? await this.getSearchResultsFromLBB({
          rome: params.rome,
          lat: params.latitude,
          lon: params.longitude,
          distance_km: params.distance_km,
        })
      : [];

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

  private async getSearchResultsFromLBB(
    params: LaBonneBoiteRequestParams,
  ): Promise<SearchImmersionResultDto[]> {
    return pipeWithValue(
      await this.laBonneBoiteAPI.searchCompanies(params),
      filter<LaBonneBoiteCompanyVO>((company) => company.isCompanyRelevant()),
      deduplicateOnSiret,
      map((company) => company.toSearchResult()),
    );
  }
}

// first occurrence of a company is kept
const deduplicateOnSiret = <T extends { siret: SiretDto }>(
  companies: T[],
): T[] => {
  const sirets = companies.map((company) => company.siret);
  return companies.filter(
    (company, companyIndex) => sirets.indexOf(company.siret) === companyIndex,
  );
};

const shouldFetchLBB = (
  rome: string | undefined,
  voluntaryToImmersion?: boolean | undefined,
): rome is string => !!rome && voluntaryToImmersion !== true;
