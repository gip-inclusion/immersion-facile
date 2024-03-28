import { prop, propEq } from "ramda";
import {
  ApiConsumer,
  AppellationCode,
  SearchQueryParamsDto,
  SearchResultDto,
  SiretDto,
  searchParamsSchema,
} from "shared";
import { histogramSearchImmersionStoredCount } from "../../../utils/counters";
import { createLogger } from "../../../utils/logger";
import { TransactionalUseCase } from "../../core/UseCase";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import { SearchMade } from "../entities/SearchMadeEntity";
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

    const [repositorySearchResults, lbbSearchResults] = await Promise.all([
      uow.establishmentAggregateRepository.searchImmersionResults({
        searchMade,
        maxResults: 100,
      }),
      shouldFetchLBB(appellationCodes, voluntaryToImmersion)
        ? this.#searchOnLbb(uow, {
            appellationCodes: appellationCodes as AppellationCode[],
            lat,
            lon,
            distanceKm,
          })
        : Promise.resolve([]),
    ]);

    await uow.searchMadeRepository.insertSearchMade({
      ...searchMade,
      id: this.uuidGenerator.new(),
      needsToBeSearched: true,
      apiConsumerName: apiConsumer?.name,
      numberOfResults:
        voluntaryToImmersion !== false
          ? repositorySearchResults.length
          : lbbSearchResults.length,
    });

    const isDeletedBySiret =
      await uow.deletedEstablishmentRepository.areSiretsDeleted(
        lbbSearchResults.map((result) => result.siret),
      );

    const searchResultsInRepo =
      voluntaryToImmersion !== false
        ? this.#prepareVoluntaryToImmersionResults(repositorySearchResults)
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
      );
  }

  #prepareVoluntaryToImmersionResults(
    results: SearchImmersionResult[],
  ): SearchResultDto[] {
    histogramSearchImmersionStoredCount.observe(results.length);
    return results.map(({ isSearchable: _, ...rest }) => rest);
  }

  async #searchOnLbb(
    uow: UnitOfWork,
    {
      appellationCodes,
      lat,
      lon,
      distanceKm,
    }: {
      appellationCodes: AppellationCode[];
      lat: number;
      lon: number;
      distanceKm: number;
    },
  ) {
    const matches =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes(
        appellationCodes,
      );

    const romeCode = matches.at(0)?.romeCode;
    if (!romeCode)
      throw new Error(
        `No Rome code matching appellation codes ${appellationCodes}`,
      );

    try {
      return await this.laBonneBoiteAPI.searchCompanies({
        rome: romeCode,
        lat,
        lon,
        distanceKm,
      });
    } catch (e) {
      logger.error(e, "Error while searching on LBB");
      return [];
    }
  }
}

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
      .filter(propEq("isSearchable", false))
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
