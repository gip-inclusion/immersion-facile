import {
  type ApiConsumer,
  type AppellationCode,
  type ExternalOfferDto,
  errors,
  type LegacySearchQueryParamsDto,
  legacySearchParamsSchema,
  type OfferDto,
  type WithNafCodes,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import {
  type GeoParams,
  hasSearchGeoParams,
  type SearchMade,
} from "../entities/SearchMadeEntity";
import type { LaBonneBoiteGateway } from "../ports/LaBonneBoiteGateway";

export class LegacySearchImmersion extends TransactionalUseCase<
  LegacySearchQueryParamsDto,
  OfferDto[],
  ApiConsumer
> {
  protected inputSchema = legacySearchParamsSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly laBonneBoiteAPI: LaBonneBoiteGateway,
    private readonly uuidGenerator: UuidGenerator,
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
    }: LegacySearchQueryParamsDto,
    uow: UnitOfWork,
    apiConsumer: ApiConsumer,
  ): Promise<OfferDto[]> {
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
      uow.establishmentAggregateRepository.legacySearchImmersionResults({
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
    WithNafCodes): Promise<ExternalOfferDto[]> {
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

const shouldFetchLBB = (
  appellationCodes: AppellationCode[] | undefined,
  voluntaryToImmersion?: boolean | undefined,
) =>
  !!appellationCodes &&
  appellationCodes.length > 0 &&
  voluntaryToImmersion !== true;
