import { prop, propEq } from "ramda";
import {
  ApiConsumer,
  AppellationCode,
  SearchImmersionParamsDto,
  searchImmersionParamsSchema,
  SearchImmersionResultDto,
  SiretDto,
} from "shared";
import { histogramSearchImmersionStoredCount } from "../../../utils/counters";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import { SearchMade } from "../entities/SearchMadeEntity";
import { SearchImmersionResult } from "../ports/EstablishmentAggregateRepository";
import { LaBonneBoiteGateway } from "../ports/LaBonneBoiteGateway";

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
    {
      distanceKm,
      latitude: lat,
      longitude: lon,
      place,
      appellationCode,
      sortedBy,
      voluntaryToImmersion,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ...rest
    }: SearchImmersionParamsDto,
    uow: UnitOfWork,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto[]> {
    const searchMade: SearchMade = {
      lat,
      lon,
      distanceKm,
      sortedBy,
      voluntaryToImmersion,
      place,
      appellationCode,
    };

    await uow.searchMadeRepository.insertSearchMade({
      ...searchMade,
      id: this.uuidGenerator.new(),
      needsToBeSearched: true,
      apiConsumerName: apiConsumer?.consumer,
    });

    const [repositorySearchResults, lbbSearchResults] = await Promise.all([
      uow.establishmentAggregateRepository.searchImmersionResults({
        searchMade,
        maxResults: 100,
      }),
      shouldFetchLBB(appellationCode, voluntaryToImmersion)
        ? this.searchOnLbb(uow, { appellationCode, lat, lon, distanceKm })
        : Promise.resolve([]),
    ]);

    return [
      ...(voluntaryToImmersion !== false
        ? this.prepareVoluntaryToImmersionResults(repositorySearchResults)
        : []),
      ...lbbSearchResults.filter(
        isSiretAlreadyInStoredResults(repositorySearchResults),
      ),
    ].filter(isSiretIsNotInNotSeachableResults(repositorySearchResults));
  }

  private async searchOnLbb(
    uow: UnitOfWork,
    {
      appellationCode,
      lat,
      lon,
      distanceKm,
    }: {
      appellationCode: AppellationCode;
      lat: number;
      lon: number;
      distanceKm: number;
    },
  ) {
    const matches =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes([
        appellationCode,
      ]);

    const romeCode = matches.at(0)?.romeCode;
    if (!romeCode)
      throw new Error(
        `No Rome code matching appellation code ${appellationCode}`,
      );

    return this.laBonneBoiteAPI.searchCompanies({
      rome: romeCode,
      lat,
      lon,
      distanceKm,
    });
  }

  private prepareVoluntaryToImmersionResults(
    results: SearchImmersionResult[],
  ): SearchImmersionResultDto[] {
    histogramSearchImmersionStoredCount.observe(results.length);
    return results.map(({ isSearchable, ...rest }) => rest);
  }
}

const shouldFetchLBB = (
  appellationCode: AppellationCode | undefined,
  voluntaryToImmersion?: boolean | undefined,
): appellationCode is string =>
  !!appellationCode && voluntaryToImmersion !== true;

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
