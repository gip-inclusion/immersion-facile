import { prop, propEq } from "ramda";
import {
  ApiConsumer,
  AppellationCode,
  SearchQueryParamsDto,
  SearchResultDto,
  SiretDto,
  castError,
  searchParamsSchema,
} from "shared";
import { createLogger } from "../../../utils/logger";
import { TransactionalUseCase } from "../../core/UseCase";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import { GeoParams, SearchMade } from "../entities/SearchMadeEntity";
import { SearchImmersionResult } from "../ports/EstablishmentAggregateRepository";
import { LaBonneBoiteGateway } from "../ports/LaBonneBoiteGateway";

const logger = createLogger(__filename);

export class SearchImmersion extends TransactionalUseCase<
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
        ? this.#searchOnLbb(uow, {
            appellationCodes: appellationCodes as AppellationCode[],
            ...geoParams,
          })
        : Promise.resolve([]),
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

    const isDeletedBySiret =
      await uow.deletedEstablishmentRepository.areSiretsDeleted(
        lbbSearchResults.map((result) => result.siret),
      );

    const searchResultsInRepo =
      voluntaryToImmersion !== false && repositorySearchResults.length > 0
        ? repositorySearchResults.map(({ isSearchable: _, ...rest }) => rest)
        : [];

    const lbbAllowedResults = lbbSearchResults
      .filter(isSiretAlreadyInStoredResults(searchResultsInRepo))
      .filter(isEstablishmentNotDeleted(isDeletedBySiret));

    return [...searchResultsInRepo, ...lbbAllowedResults]
      .filter(isSiretIsNotInNotSearchableResults(repositorySearchResults))
      .filter(
        isSearchResultAvailable(
          repositorySearchResults,
          this.timeGateway.now(),
        ),
      )
      .sort((a, b) =>
        sortedBy === "score" ? b.establishmentScore - a.establishmentScore : 0,
      );
  }

  async #searchOnLbb(
    uow: UnitOfWork,
    params: {
      appellationCodes: AppellationCode[];
    } & GeoParams,
  ): Promise<SearchResultDto[]> {
    const { appellationCodes, ...geoParams } = params;
    const matches =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes(
        appellationCodes,
      );

    const romeAndAppellationData = matches.at(0);
    if (!romeAndAppellationData)
      throw new Error(
        `No Rome code matching appellation codes ${appellationCodes}`,
      );
    const { romeCode, romeLabel } = romeAndAppellationData;
    if (hasSearchGeoParams(geoParams))
      try {
        const lbbResults = await this.laBonneBoiteAPI.searchCompanies({
          rome: romeCode,
          romeLabel,
          ...geoParams,
        });
        return lbbResults.filter((result) => {
          if (!result.distance_m) return true;
          return result.distance_m <= params.distanceKm * 1000;
        });
      } catch (error) {
        logger.error({
          message: "Error while searching on LBB",
          error: castError(error),
        });
        return [];
      }
    return [];
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

const isSiretAlreadyInStoredResults =
  (searchImmersionQueryResults: SearchResultDto[]) =>
  <T extends { siret: SiretDto }>({ siret }: T) =>
    !searchImmersionQueryResults.map(prop("siret")).includes(siret);

const isSiretIsNotInNotSearchableResults =
  (searchImmersionQueryResults: SearchImmersionResult[]) =>
  <T extends { siret: SiretDto }>({ siret }: T) =>
    !searchImmersionQueryResults
      .filter(propEq(false, "isSearchable"))
      .map(prop("siret"))
      .includes(siret);

const isSearchResultAvailable =
  (searchImmersionQueryResults: SearchImmersionResult[], now: Date) =>
  <T extends { siret: SiretDto }>({ siret }: T) =>
    !searchImmersionQueryResults
      .filter((searchResult) =>
        searchResult.nextAvailabilityDate
          ? new Date(searchResult.nextAvailabilityDate) > now
          : false,
      )
      .map(prop("siret"))
      .includes(siret);

const isEstablishmentNotDeleted =
  (deletedSirets: Record<SiretDto, boolean>) =>
  <T extends { siret: SiretDto }>({ siret }: T) =>
    !deletedSirets[siret];
