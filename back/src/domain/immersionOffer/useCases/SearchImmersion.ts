import { prop, propEq } from "ramda";
import {
  ApiConsumer,
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
      rome,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ...rest
    }: SearchImmersionParamsDto,
    uow: UnitOfWork,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto[]> {
    const searchMade: SearchMade = {
      rome,
      lat,
      lon,
      distanceKm,
      sortedBy,
      voluntaryToImmersion,
      place,
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
        withContactDetails: false,
        maxResults: 100,
      }),
      shouldFetchLBB(rome, voluntaryToImmersion)
        ? this.laBonneBoiteAPI.searchCompanies({
            rome,
            lat,
            lon,
            distanceKm,
          })
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

  private prepareVoluntaryToImmersionResults(
    results: SearchImmersionResult[],
  ): SearchImmersionResultDto[] {
    histogramSearchImmersionStoredCount.observe(results.length);
    return results.map(({ isSearchable, ...rest }) => rest);
  }
}

const shouldFetchLBB = (
  rome: string | undefined,
  voluntaryToImmersion?: boolean | undefined,
): rome is string => !!rome && voluntaryToImmersion !== true;

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
