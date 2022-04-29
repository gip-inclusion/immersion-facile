import { groupBy } from "ramda";
import { removeUndefinedElements, replaceArrayElement } from "shared/src/utils";
import { distanceBetweenCoordinatesInMeters } from "../../../utils/distanceBetweenCoordinatesInMeters";
import { createLogger } from "../../../utils/logger";
import { PipelineStats } from "../../../utils/pipelineStats";
import { Clock } from "../../core/ports/Clock";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import {
  SireneEstablishmentVO,
  SireneRepository,
} from "../../sirene/ports/SireneRepository";
import { EstablishmentAggregate } from "../entities/EstablishmentEntity";
import { SearchMade, SearchMadeEntity } from "../entities/SearchMadeEntity";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";
import { LaBonneBoiteAPI } from "../ports/LaBonneBoiteAPI";
import { SearchMadeRepository } from "../ports/SearchMadeRepository";
import { LaBonneBoiteCompanyVO } from "../valueObjects/LaBonneBoiteCompanyVO";

// The number of unexpected errors to tolerate befor aborting the pipeline execution.
const MAX_UNEXPECTED_ERRORS = 10;
const GROUP_DISTANCE_CRITERIA = 30;

const logger = createLogger(__filename);

export class UpdateEstablishmentsAndImmersionOffersFromLastSearches {
  public readonly stats = new PipelineStats(this.constructor.name);

  constructor(
    private readonly uuidGenerator: UuidGenerator,
    private readonly clock: Clock,
    private readonly laBonneBoiteAPI: LaBonneBoiteAPI,
    private readonly sireneRepository: SireneRepository,
    private readonly searchMadeRepository: SearchMadeRepository,
    private readonly establishmentAggregateRepository: EstablishmentAggregateRepository,
  ) {}

  public async execute() {
    // Take all searches made in the past.
    const searchesMade: SearchMadeEntity[] =
      await this.searchMadeRepository.retrievePendingSearches();

    const searchMadeGroups: SearchMadeGroup[] = searchesMade.reduce(
      matchBelongingGroupOrCreateNewGroup,
      [] as SearchMadeGroup[],
    );

    logger.info(
      `Found ${searchesMade.length} unprocessed rows in the searches_made table.`,
    );
    this.stats.incCounter(
      "pg-searches_made-unprocessed_searches_found",
      searchesMade.length,
    );

    const unexpectedErrors = [];
    for (const searchMadeGroup of searchMadeGroups) {
      try {
        const {
          rome: romeToCallAPIWith,
          lon: lonToCallAPIWith,
          lat: latToCallAPIWith,
        } = searchMadeGroup[0];
        const maxGroupDistanceKm = Math.max(
          ...searchMadeGroup.map((searchMade) => searchMade.distance_km),
        );

        const distanceKmToCallAPIWith =
          GROUP_DISTANCE_CRITERIA + maxGroupDistanceKm;

        const searchHasBeenProcessed = await this.processSearchMade({
          rome: romeToCallAPIWith,
          lon: lonToCallAPIWith,
          lat: latToCallAPIWith,
          distance_km: distanceKmToCallAPIWith,
        });
        if (searchHasBeenProcessed)
          await Promise.all(
            searchMadeGroup.map((searchMade) =>
              this.searchMadeRepository.markSearchAsProcessed(searchMade.id),
            ),
          );
      } catch (error: any) {
        unexpectedErrors.push(error);
        if (unexpectedErrors.length > MAX_UNEXPECTED_ERRORS) {
          logger.fatal(
            "Too many unexpected errors. Aborting pipeline execution.",
          );
          throw error;
        }
      }
    }
  }

  private async processSearchMade(searchMade: SearchMade): Promise<boolean> {
    logger.debug({ searchMade }, "processSearchMade");
    this.stats.incCounter("process_search_made-total");
    this.stats.startAggregateTimer("process_search_made-latency");

    try {
      // Check if we have potential immersions in our available databases.
      const establishmentAggregates = await this.search(searchMade);
      if (establishmentAggregates === null) return false;

      logger.debug(
        { searchParams: searchMade },
        `Search yielded ${establishmentAggregates.length} establishments and ` +
          `${countOffers(establishmentAggregates)} immersions.`,
      );

      const dedupedAggregates = dedupeEstablishmentAggregates(
        establishmentAggregates,
      );

      await this.establishmentAggregateRepository.insertEstablishmentAggregates(
        dedupedAggregates,
      );
      logger.info(
        { searchParams: searchMade },
        `Inserted ${dedupedAggregates.length} establishments and ` +
          `${countOffers(dedupedAggregates)} immersions.`,
      );
      this.stats.recordSample(
        "pg-establishment-aggregates_inserted",
        dedupedAggregates.length,
      );
      this.stats.incCounter("process_search_made-success");
    } catch (error: any) {
      this.stats.incCounter("process_search_made-error");
      throw error;
    } finally {
      this.stats.stopAggregateTimer("process_search_made-latency");
    }

    this.stats.stopAggregateTimer("process_search_made-latency");
    this.stats.incCounter("process_search_made-success");
    return true;
  }

  private async search(
    searchMade: SearchMade,
  ): Promise<EstablishmentAggregate[]> {
    this.stats.incCounter("search-total");

    if (!searchMade.rome) return [];

    const laBonneBoiteSearchResults = await this.searchLaBonneBoite({
      ...searchMade,
      rome: searchMade.rome,
    });

    return laBonneBoiteSearchResults;
  }

  private async searchLaBonneBoite(
    searchMade: SearchMade & { rome: string },
  ): Promise<EstablishmentAggregate[]> {
    try {
      const laBonneBoiteCompanies = await this.laBonneBoiteAPI.searchCompanies(
        searchMade,
      );
      const laBonneBoiteRelevantCompanies = laBonneBoiteCompanies.filter(
        (company) => company.isCompanyRelevant(),
      );
      const establishmentAggregates = await Promise.all(
        laBonneBoiteRelevantCompanies.map((aggregate) =>
          this.convertLaBonneBoiteCompanyToEstablishmentAggregate(aggregate),
        ),
      );
      return removeUndefinedElements(establishmentAggregates);
    } catch (error: any) {
      //eslint-disable-next-line no-console
      console.log("Error in searchLaBonneBoite ", error);
      logger.error({ searchMade }, "Error in searchLaBonneBoite: " + error);
      throw error;
    }
  }

  private async convertLaBonneBoiteCompanyToEstablishmentAggregate(
    laBonneBoiteCompany: LaBonneBoiteCompanyVO,
  ): Promise<EstablishmentAggregate | undefined> {
    const sireneAnswer = await this.sireneRepository.get(
      laBonneBoiteCompany.siret,
    );
    if (!sireneAnswer || sireneAnswer.etablissements.length === 0) {
      logger.warn(
        { siret: laBonneBoiteCompany.siret },
        "Company from LaBonneBoite API not found in SIRENE",
      );
      return;
    }
    const sireneEstablishment = new SireneEstablishmentVO(
      sireneAnswer.etablissements[0],
    );

    const nafDto = sireneEstablishment.nafAndNomenclature;
    const numberEmployeesRange = sireneEstablishment.numberEmployeesRange;
    const updatedAt = this.clock.now();

    return laBonneBoiteCompany.toEstablishmentAggregate(
      this.uuidGenerator,
      updatedAt,
      {
        nafDto,
        numberEmployeesRange,
      },
    );
  }
}

const countOffers = (aggregates: EstablishmentAggregate[]) =>
  aggregates.reduce(
    (acc, aggregate) => acc + aggregate.immersionOffers.length,
    0,
  );

const dedupeEstablishmentAggregates = (
  aggregates: EstablishmentAggregate[],
) => {
  const aggregatesBySiret = groupBy(
    (aggregate) => aggregate.establishment.siret,
    aggregates,
  );

  // Keep only the first aggregate for each siret.
  // TODO: Consider additional consolidations, e.g. keeping all (deduped)
  // immersion offers or contacts.
  const dedupedAggregates = Object.values(aggregatesBySiret).map(
    (aggregateList) => {
      const [head, ...tail] = aggregateList;
      if (tail.length > 0) {
        logger.warn(
          { head, tail },
          "Duplicate establishment aggregates found. Keeping head, discarding tail.",
        );
      }
      return head;
    },
  );

  return dedupedAggregates;
};

const matchBelongingGroupOrCreateNewGroup = (
  searchMadeGroups: SearchMadeGroup[],
  searchMade: SearchMadeEntity,
) => {
  const belongingGroup = findFirstBelongingGroupIndex(
    searchMade,
    searchMadeGroups,
  );
  if (belongingGroup !== -1) {
    return replaceArrayElement(searchMadeGroups, belongingGroup, [
      ...searchMadeGroups[belongingGroup],
      searchMade,
    ]);
  }

  return [...searchMadeGroups, [searchMade]];
};

type SearchMadeGroup = SearchMadeEntity[];

const findFirstBelongingGroupIndex = (
  searchMade: SearchMadeEntity,
  groups: SearchMadeGroup[],
): number =>
  groups.findIndex((group) => {
    const distanceBetweenSearchesKm =
      distanceBetweenCoordinatesInMeters(
        group[0].lon,
        group[0].lat,
        searchMade.lon,
        searchMade.lat,
      ) / 1000;

    return (
      group[0].rome === searchMade.rome &&
      distanceBetweenSearchesKm < GROUP_DISTANCE_CRITERIA
    );
  });
