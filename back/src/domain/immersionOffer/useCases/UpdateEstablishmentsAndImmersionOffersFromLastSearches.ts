import { createLogger } from "../../../utils/logger";
import { PipelineStats } from "../../../utils/pipelineStats";
import { SireneRepository } from "../../sirene/ports/SireneRepository";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";
import {
  GetPosition,
  UncompleteEstablishmentEntity,
} from "../entities/UncompleteEstablishmentEntity";
import { EstablishmentsGateway } from "../ports/EstablishmentsGateway";
import {
  ImmersionOfferRepository,
  SearchParams,
} from "../ports/ImmersionOfferRepository";

const logger = createLogger(__filename);

export class UpdateEstablishmentsAndImmersionOffersFromLastSearches {
  public readonly stats = new PipelineStats(this.constructor.name);

  constructor(
    private readonly laBonneBoiteGateway: EstablishmentsGateway,
    private readonly laPlateFormeDeLinclusionGateway: EstablishmentsGateway,
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
      this.stats.incCounter(
        "pg-establishments-rows_inserted",
        establishments.length,
      );
    }
    if (immersions.length > 0) {
      await this.immersionOfferRepository.insertImmersions(immersions);
      this.stats.incCounter(
        "pg-immersion_offers-rows_inserted",
        immersions.length,
      );
    }
    this.stats.incCounter("process_search_made-success");
  }

  private async search(
    searchParams: SearchParams,
  ): Promise<EstablishmentEntity[]> {
    this.stats.incCounter("populate_missing_search-total");

    // TODO(nsw): Parallelize once we have request throttling.
    return [
      await this.populateMissingFields(
        await this.laPlateFormeDeLinclusionGateway.getEstablishments(
          searchParams,
        ),
      ),
      await this.populateMissingFields(
        await this.laBonneBoiteGateway.getEstablishments(searchParams),
      ),
    ].flat();
  }

  private async populateMissingFields(
    uncompleteEstablishments: UncompleteEstablishmentEntity[],
  ): Promise<EstablishmentEntity[]> {
    const completeEstablishments: EstablishmentEntity[] = [];
    this.stats.incCounter("populate_missing_fields-total");

    // TODO(nsw): Parallelize once we have request throttling.
    for (let uncompleteEstablishment of uncompleteEstablishments) {
      const completeEstablishment =
        await uncompleteEstablishment.searchForMissingFields(
          this.getPosition,
          this.sireneRepository,
        );
      if (completeEstablishment) {
        this.stats.incCounter("populate_missing_fields-establishment-kept");
        completeEstablishments.push(completeEstablishment);
      } else {
        this.stats.incCounter("populate_missing_fields-establishment-skipped");
      }
    }
    return completeEstablishments;
  }
}
