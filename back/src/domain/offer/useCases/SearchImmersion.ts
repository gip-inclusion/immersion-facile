import { prop, propEq } from "ramda";
import {
  ApiConsumer,
  AppellationCode,
  searchParamsSchema,
  SearchQueryParamsDto,
  SearchResultDto,
  SiretDto,
} from "shared";
import { histogramSearchImmersionStoredCount } from "../../../utils/counters";
import { createLogger } from "../../../utils/logger";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
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
      apiConsumerName: apiConsumer?.consumer,
      numberOfResults:
        voluntaryToImmersion !== false
          ? repositorySearchResults.length
          : lbbSearchResults.length,
    });

    const isDeletedBySiret =
      await uow.deletedEstablishmentRepository.areSiretsDeleted(
        lbbSearchResults.map((result) => result.siret),
      );

    return [
      ...(voluntaryToImmersion !== false
        ? this.#prepareVoluntaryToImmersionResults(repositorySearchResults)
        : []),
      ...lbbSearchResults
        .filter(isSiretAlreadyInStoredResults(repositorySearchResults))
        .filter(isEstablishmentNotDeleted(isDeletedBySiret)),
    ].filter(isSiretIsNotInNotSeachableResults(repositorySearchResults));
  }

  #prepareVoluntaryToImmersionResults(
    results: SearchImmersionResult[],
  ): SearchResultDto[] {
    histogramSearchImmersionStoredCount.observe(results.length);
    return results.map(({ isSearchable, ...rest }) => rest);
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
  (searchImmersionQueryResults: SearchImmersionResult[]) =>
  <T extends { siret: SiretDto }>({ siret }: T) =>
    !searchImmersionQueryResults.map(prop("siret")).includes(siret);

const isSiretIsNotInNotSeachableResults =
  (searchImmersionQueryResults: SearchImmersionResult[]) =>
  <T extends { siret: SiretDto }>({ siret }: T) =>
    !searchImmersionQueryResults
      .filter(propEq("isSearchable", false))
      .map(prop("siret"))
      .includes(siret);

const isEstablishmentNotDeleted =
  (deletedSirets: Record<SiretDto, boolean>) =>
  <T extends { siret: SiretDto }>({ siret }: T) =>
    !deletedSirets[siret];
