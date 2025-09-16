import {
  type ApiConsumer,
  type AppellationCode,
  errors,
  type SearchQueryParamsDto,
  type SearchResultDto,
  searchParamsSchema,
  type WithNafCodes,
} from "shared";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import type { GeoParams, SearchMade } from "../entities/SearchMadeEntity";
import type { LaBonneBoiteGateway } from "../ports/LaBonneBoiteGateway";

export class LegacySearchImmersion extends TransactionalUseCase<
  SearchQueryParamsDto,
  SearchResultDto[],
  ApiConsumer
> {
  protected inputSchema = searchParamsSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly laBonneBoiteAPI: LaBonneBoiteGateway,
    private readonly uuidGenerator: UuidGenerator,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    {
      distanceKm,
      latitude: lat,
      longitude: lon,
      place,
      appellationCodes,
      sortedBy,
      voluntaryToImmersion,
      rome,
      establishmentSearchableBy,
      acquisitionCampaign,
      acquisitionKeyword,
      fitForDisabledWorkers,
      nafCodes,
    }: SearchQueryParamsDto,
    uow: UnitOfWork,
    apiConsumer: ApiConsumer,
  ): Promise<SearchResultDto[]> {
    const searchMade: SearchMade = {
      lat,
      lon,
      distanceKm,
      sortedBy,
      voluntaryToImmersion,
      place,
      appellationCodes,
      romeCode: rome,
      establishmentSearchableBy,
      acquisitionCampaign,
      acquisitionKeyword,
      nafCodes,
    };
    const geoParams = { lat, lon, distanceKm };
    const [repositorySearchResults, lbbSearchResults] = await Promise.all([
      uow.establishmentAggregateRepository.searchImmersionResults({
        searchMade,
        fitForDisabledWorkers,
        maxResults: 100,
      }),
      shouldFetchLBB(appellationCodes, voluntaryToImmersion) &&
      hasSearchGeoParams(geoParams)
        ? this.#searchOnLbb({
            uow,
            appellationCodes: appellationCodes as AppellationCode[],
            ...geoParams,
            nafCodes,
          })
        : [],
    ]);

    await uow.searchMadeRepository.insertSearchMade({
      ...searchMade,
      id: this.uuidGenerator.new(),
      needsToBeSearched: true,
      apiConsumerName: apiConsumer?.name,
      numberOfResults:
        voluntaryToImmersion !== false // cases where voluntaryToImmersion is undefined and true
          ? repositorySearchResults.length
          : lbbSearchResults.length,
    });

    const searchResultsInRepo =
      voluntaryToImmersion !== false && repositorySearchResults.length > 0
        ? repositorySearchResults.map(({ isSearchable: _, ...rest }) => rest)
        : [];

    const lbbSirets = lbbSearchResults.map(({ siret }) => siret);

    const lbbSiretsAlreadySavedInRepo =
      await uow.establishmentAggregateRepository.getSiretsInRepoFromSiretList(
        lbbSirets,
      );

    const isSiretDeletedBySiret =
      await uow.deletedEstablishmentRepository.areSiretsDeleted(lbbSirets);

    const lbbAllowedResults = lbbSearchResults
      .filter(
        (lbbSearchResult) =>
          !lbbSiretsAlreadySavedInRepo.includes(lbbSearchResult.siret),
      )
      .filter(
        (lbbSearchResult) => !isSiretDeletedBySiret[lbbSearchResult.siret],
      );

    return [...searchResultsInRepo, ...lbbAllowedResults].sort((a, b) =>
      sortedBy === "score" ? b.establishmentScore - a.establishmentScore : 0,
    );
  }

  async #searchOnLbb({
    uow,
    appellationCodes,
    ...geoAndNaf
  }: {
    uow: UnitOfWork;
    appellationCodes: AppellationCode[];
  } & GeoParams &
    WithNafCodes): Promise<SearchResultDto[]> {
    const appellationsAndRomes =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
        appellationCodes,
      );

    const firstRomeAndAppellationData = appellationsAndRomes.at(0);
    if (!firstRomeAndAppellationData)
      throw errors.search.noRomeForAppellations(appellationCodes);

    const lbbResults = await this.laBonneBoiteAPI.searchCompanies({
      ...firstRomeAndAppellationData,
      ...geoAndNaf,
    });

    return lbbResults;
  }
}

export const hasSearchGeoParams = (
  geoParams: Partial<GeoParams>,
): geoParams is GeoParams =>
  !!geoParams.lat &&
  !!geoParams.lon &&
  !!geoParams.distanceKm &&
  geoParams.distanceKm > 0;

const shouldFetchLBB = (
  appellationCodes: AppellationCode[] | undefined,
  voluntaryToImmersion?: boolean | undefined,
) =>
  !!appellationCodes &&
  appellationCodes.length > 0 &&
  voluntaryToImmersion !== true;
