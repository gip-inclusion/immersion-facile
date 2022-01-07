import { RomeCodeMetierDto } from "../../../shared/rome";
import { groupBy, removeUndefinedElements } from "../../../shared/utils";
import { createLogger } from "../../../utils/logger";
import { PipelineStats } from "../../../utils/pipelineStats";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import {
  SireneRepository,
  SireneRepositoryAnswer,
} from "../../sirene/ports/SireneRepository";
import {
  EstablishmentAggregate,
  TefenCode,
} from "../entities/EstablishmentEntity";
import { SearchMade } from "../entities/SearchMadeEntity";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { LaBonneBoiteAPI } from "../ports/LaBonneBoiteAPI";
import { SearchesMadeRepository } from "../ports/SearchesMadeRepository";
import { LaBonneBoiteCompanyVO } from "../valueObjects/LaBonneBoiteCompanyVO";

const logger = createLogger(__filename);

export class UpdateEstablishmentsAndImmersionOffersFromLastSearches {
  public readonly stats = new PipelineStats(this.constructor.name);

  constructor(
    private readonly uuidGenerator: UuidGenerator,
    private readonly laBonneBoiteAPI: LaBonneBoiteAPI,
    private readonly sireneRepository: SireneRepository,
    private readonly searchesMadeRepository: SearchesMadeRepository,
    private readonly immersionOfferRepository: ImmersionOfferRepository,
  ) {}

  public async execute() {
    // Take all searches made in the past.
    const searchesMade =
      await this.searchesMadeRepository.markPendingSearchesAsProcessedAndRetrieveThem();

    logger.info(
      `Found ${searchesMade.length} unprocessed rows in the searches_made table.`,
    );
    this.stats.incCounter(
      "pg-searches_made-unprocessed_searches_found",
      searchesMade.length,
    );

    await Promise.all(
      searchesMade.map((searchMade) => this.processSearchMade(searchMade)),
    );
  }

  private async processSearchMade(searchMade: SearchMade) {
    logger.debug({ searchMade }, "processSearchMade");
    this.stats.incCounter("process_search_made-total");
    this.stats.startAggregateTimer("process_search_made-latency");

    try {
      const establishmentAggregates = await this.search(searchMade);

      logger.info(
        { searchParams: searchMade },
        `Search yielded ${establishmentAggregates.length} establishments and ` +
          `${countOffers(establishmentAggregates)} immersions.`,
      );

      const dedupedAggregates = dedupeEstablishmentAggregates(
        establishmentAggregates,
      );

      logger.info(
        { searchParams: searchMade },
        `After deduping: ${dedupedAggregates.length} establishments and ` +
          `${countOffers(dedupedAggregates)} immersions to insert.`,
      );

      await this.immersionOfferRepository.insertEstablishmentAggregates(
        dedupedAggregates,
      );
      this.stats.recordSample(
        "pg-establishment-aggregates_inserted",
        dedupedAggregates.length,
      );
    } catch (error: any) {
      logger.error(
        { searchParams: searchMade },
        "Error in processSearchMade: " + error,
      );
      this.stats.incCounter("process_search_made-error");
    }

    this.stats.stopAggregateTimer("process_search_made-latency");
    this.stats.incCounter("process_search_made-success");
  }

  private async search(
    searchMade: SearchMade,
  ): Promise<EstablishmentAggregate[]> {
    this.stats.incCounter("search-total");

    const establishmentAggregateLists = await this.searchLaBonneBoite(
      searchMade,
    );

    return establishmentAggregateLists.flat();
  }

  private async searchLaBonneBoite(
    searchMade: SearchMade,
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
      logger.error({ searchMade }, "Error in searchLaBonneBoite: " + error);
      return [];
    }
  }

  private async convertLaBonneBoiteCompanyToEstablishmentAggregate(
    laBonneBoiteCompany: LaBonneBoiteCompanyVO,
  ): Promise<EstablishmentAggregate | undefined> {
    const sireneAnswer = await this.sireneRepository.get(
      laBonneBoiteCompany.siret,
    );
    if (!sireneAnswer) {
      logger.warn(
        { siret: laBonneBoiteCompany.siret },
        "Company from LaBonneBoite API not found in SIRENE",
      );
      return;
    }

    const naf = inferNafFromSireneAnswer(sireneAnswer);
    const numberEmployeesRange =
      inferNumberEmployeesRangeFromSireneAnswer(sireneAnswer);

    return laBonneBoiteCompany.toEstablishmentAggregate(this.uuidGenerator, {
      naf,
      numberEmployeesRange,
    });
  }
}

// Those will probably be shared in a utils/helpers folder
const inferNafFromSireneAnswer = (sireneRepoAnswer: SireneRepositoryAnswer) =>
  sireneRepoAnswer.etablissements[0].uniteLegale.activitePrincipaleUniteLegale?.replace(
    ".",
    "",
  );

const inferNumberEmployeesRangeFromSireneAnswer = (
  sireneRepoAnswer: SireneRepositoryAnswer,
): TefenCode => {
  const tefenCode =
    sireneRepoAnswer.etablissements[0].uniteLegale.trancheEffectifsUniteLegale;

  return !tefenCode || tefenCode == "NN" ? -1 : <TefenCode>+tefenCode;
};

const countOffers = (aggregates: EstablishmentAggregate[]) =>
  aggregates.reduce(
    (acc, aggregate) => acc + aggregate.immersionOffers.length,
    0,
  );

const dedupeEstablishmentAggregates = (
  aggregates: EstablishmentAggregate[],
) => {
  const aggregatesBySiret = groupBy(
    aggregates,
    (aggregate) => aggregate.establishment.siret,
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
