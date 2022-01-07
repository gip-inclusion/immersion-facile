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

    for (const searchMade of searchesMade) {
      await this.processSearchMade(searchMade);
    }
  }

  private async processSearchMade(searchMade: SearchMade) {
    logger.debug({ searchMade }, "processSearchMade");
    this.stats.incCounter("process_search_made-total");
    this.stats.startAggregateTimer("process_search_made-latency");

    // Check if we have potential immersions in our available databases.
    const establishmentAggregates = await this.search(searchMade);

    const nbOfOffers = establishmentAggregates.reduce(
      (acc, aggregate) => acc + aggregate.immersionOffers.length,
      0,
    );

    logger.info(
      { searchMade },
      `Search yielded ${establishmentAggregates.length} establishments and ` +
        `${nbOfOffers} immersions to insert.`,
    );

    // Insert the establishments and immersions in the database.
    if (establishmentAggregates.length > 0) {
      await this.immersionOfferRepository.insertEstablishmentAggregates(
        establishmentAggregates,
      );
      this.stats.recordSample(
        "pg-establishments-rows_inserted",
        establishmentAggregates.length,
      );
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

      // Todo : Eventually use a sequenceRunner or parallelize
      const establishmentAggregates: EstablishmentAggregate[] = [];
      for (const laBonneBoiteCompany of laBonneBoiteRelevantCompanies) {
        const establishmentAggregate =
          await this.convertLaBonneBoiteCompanyToEstablishmentAggregate(
            laBonneBoiteCompany,
          );
        if (!!establishmentAggregate)
          establishmentAggregates.push(establishmentAggregate);
      }
      return establishmentAggregates;
    } catch (error: any) {
      logger.warn("Error in searchLaBonneBoite: " + error);
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
        "Company not found in SIRENE",
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
