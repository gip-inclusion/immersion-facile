import { createLogger } from "../../../utils/logger";
import { PipelineStats } from "../../../utils/pipelineStats";
import { SireneRepository } from "../../sirene/ports/SireneRepository";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";
import { EstablishmentsGateway } from "../ports/EstablishmentsGateway";
import { GetPosition } from "../ports/GetPosition";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { UncompleteEstablishmentEntity } from "./../entities/UncompleteEstablishmentEntity";
import { SearchParams } from "./../ports/ImmersionOfferRepository";

const logger = createLogger(__filename);

export class UpdateEstablishmentsAndImmersionOffersFromLastSearches {
  public readonly stats = new PipelineStats(this.constructor.name);

  constructor(
    private readonly laBonneBoiteGateway: EstablishmentsGateway,
    private readonly laPlateFormeDeLInclusionGateway: EstablishmentsGateway,
    private readonly getPosition: GetPosition,
    private readonly sireneRepository: SireneRepository,
    private readonly immersionOfferRepository: ImmersionOfferRepository,
  ) {}

  public async execute() {
    // Take all searches made in the past.
    const searchesMade =
      await this.immersionOfferRepository.markPendingResearchesAsProcessedAndRetrieveThem();

    logger.info(
      `Found ${searchesMade.length} unprocessed rows in the searches_made table.`,
    );
    this.stats.incCounter(
      "pg-searches_made-unprocessed_searches_found",
      searchesMade.length,
    );

    for (let searchParams of searchesMade) {
      await this.processSearchMade(searchParams);
    }
  }

  private async processSearchMade(searchParams: SearchParams) {
    logger.debug({ searchParams }, "processSearchMade");
    this.stats.incCounter("process_search_made-total");
    this.stats.startAggregateTimer("process_search_made-latency");

    // Check if we have potential immersions in our available databases.
    const establishments = await this.search(searchParams);

    // Transform them into immersions.
    const immersions = establishments.flatMap((establishment) =>
      establishment.extractImmersions(),
    );

    logger.info(
      { searchParams },
      `Search yielded ${establishments.length} establishments and ` +
        `${immersions.length} immersions to insert.`,
    );

    // Insert the establishments and immersions in the database.
    if (establishments.length > 0) {
      await this.immersionOfferRepository.insertEstablishments(establishments);
      this.stats.recordSample(
        "pg-establishments-rows_inserted",
        establishments.length,
      );
    }
    if (immersions.length > 0) {
      await this.immersionOfferRepository.insertImmersions(immersions);
      this.stats.recordSample(
        "pg-immersion_offers-rows_inserted",
        immersions.length,
      );
    }
    this.stats.stopAggregateTimer("process_search_made-latency");
    this.stats.incCounter("process_search_made-success");
  }

  private async search(
    searchParams: SearchParams,
  ): Promise<EstablishmentEntity[]> {
    this.stats.incCounter("search-total");

    // TODO(nsw): Parallelize once we have request throttling.
    return [
      await this.searchInternal(
        this.laPlateFormeDeLInclusionGateway,
        searchParams,
        "search-la_plateforme_de_l_inclusion",
      ),
      await this.searchInternal(
        this.laBonneBoiteGateway,
        searchParams,
        "search-la_bonne_boite",
      ),
    ].flat();
  }

  private async searchInternal(
    establishmentGateway: EstablishmentsGateway,
    searchParams: SearchParams,
    counterNamePrefix: string,
  ): Promise<EstablishmentEntity[]> {
    this.stats.startAggregateTimer(`${counterNamePrefix}-latency`);
    const uncompleteEstablishments =
      await establishmentGateway.getEstablishments(searchParams);
    this.stats.stopAggregateTimer(`${counterNamePrefix}-latency`);

    this.stats.recordSample(
      `${counterNamePrefix}-establishments_found`,
      uncompleteEstablishments.length,
    );

    const usableEstablishments = await this.populateMissingFields(
      uncompleteEstablishments,
    );
    this.stats.recordSample(
      `${counterNamePrefix}-establishments_used`,
      usableEstablishments.length,
    );
    this.stats.recordSample(
      `${counterNamePrefix}-establishments_skipped`,
      uncompleteEstablishments.length - usableEstablishments.length,
    );

    return usableEstablishments;
  }

  private async populateMissingFields(
    uncompleteEstablishments: UncompleteEstablishmentEntity[],
  ): Promise<EstablishmentEntity[]> {
    const completeEstablishments: EstablishmentEntity[] = [];

    // TODO(nsw): Parallelize once we have request throttling.
    for (let uncompleteEstablishment of uncompleteEstablishments) {
      this.stats.startAggregateTimer("search_for_missing_fields-latency");
      const completeEstablishment =
        await uncompleteEstablishment.searchForMissingFields(
          this.getPosition,
          this.sireneRepository,
        );
      this.stats.stopAggregateTimer("search_for_missing_fields-latency");
      if (completeEstablishment)
        completeEstablishments.push(completeEstablishment);
    }
    return completeEstablishments;
  }
}
