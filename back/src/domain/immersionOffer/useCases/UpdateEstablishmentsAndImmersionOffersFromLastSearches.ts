import { createLogger } from "../../../utils/logger";
import { PipelineStats } from "../../../utils/pipelineStats";
import { SireneRepository } from "../../sirene/ports/SireneRepository";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";
import { SearchParams } from "../entities/SearchParams";
import { GetPosition } from "../ports/GetPosition";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { LaPlateformeDeLInclusionAPI } from "../ports/LaPlateformeDeLInclusionAPI";
import { UuidGenerator } from "./../../core/ports/UuidGenerator";
import { UncompleteEstablishmentEntity } from "./../entities/UncompleteEstablishmentEntity";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteCompany,
} from "./../ports/LaBonneBoiteAPI";
import { SearchesMadeRepository } from "./../ports/SearchesMadeRepository";

const logger = createLogger(__filename);

export class UpdateEstablishmentsAndImmersionOffersFromLastSearches {
  public readonly stats = new PipelineStats(this.constructor.name);

  constructor(
    private readonly uuidGenerator: UuidGenerator,
    private readonly laBonneBoiteAPI: LaBonneBoiteAPI,
    private readonly laPlateFormeDeLInclusionAPI: LaPlateformeDeLInclusionAPI,
    private readonly getPosition: GetPosition,
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
        () => this.searchLaBonneBoite(searchParams),
        "search-la_plateforme_de_l_inclusion",
      ),
      await this.searchInternal(
        () => this.searchLaPlateformeDeLInclusion(searchParams),
        "search-la_bonne_boite",
      ),
    ].flat();
  }

  private async searchInternal(
    searchFn: () => Promise<UncompleteEstablishmentEntity[]>,
    counterNamePrefix: string,
  ): Promise<EstablishmentEntity[]> {
    this.stats.startAggregateTimer(`${counterNamePrefix}-latency`);
    const uncompleteEstablishments = await searchFn();
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

  private async searchLaBonneBoite(
    searchParams: SearchParams,
  ): Promise<UncompleteEstablishmentEntity[]> {
    try {
      const laBonneBoiteResponse = await this.laBonneBoiteAPI.searchCompanies(
        searchParams,
      );

      return laBonneBoiteResponse
        .filter((company) =>
          this.keepRelevantCompanies(searchParams.rome, company),
        )
        .map(
          (company) =>
            new UncompleteEstablishmentEntity({
              id: this.uuidGenerator.new(),
              address: company.address,
              position: { lat: company.lat, lon: company.lon },
              naf: company.naf,
              name: company.name,
              siret: company.siret,
              score: company.stars,
              voluntaryToImmersion: false,
              romes: [company.matched_rome_code],
              dataSource: "api_labonneboite",
            }),
        );
    } catch (error: any) {
      return [];
    }
  }

  private keepRelevantCompanies(
    romeSearched: string,
    company: LaBonneBoiteCompany,
  ): boolean {
    if (
      (company.naf.startsWith("9609") && romeSearched == "A1408") ||
      (company.naf == "XXXXX" && romeSearched == "A1503") ||
      (company.naf == "5610C" && romeSearched == "D1102") ||
      (company.naf.startsWith("8411") && romeSearched == "D1202") ||
      (company.naf.startsWith("8411") &&
        [
          "D1202",
          "G1404",
          "G1501",
          "G1502",
          "G1503",
          "G1601",
          "G1602",
          "G1603",
          "G1605",
          "G1802",
          "G1803",
        ].indexOf(romeSearched) > -1)
    ) {
      logger.info({ company }, "Not relevant, discarding.");
      return false;
    } else {
      logger.debug({ company }, "Relevant.");
      return true;
    }
  }

  private async searchLaPlateformeDeLInclusion(
    searchParams: SearchParams,
  ): Promise<UncompleteEstablishmentEntity[]> {
    const results = await this.laPlateFormeDeLInclusionAPI.getResults(
      searchParams,
    );
    return results.map(
      (result) =>
        new UncompleteEstablishmentEntity({
          id: this.uuidGenerator.new(),
          address: [
            result.addresse_ligne_1,
            result.addresse_ligne_2,
            result.code_postal,
            result.ville,
          ]
            .filter((el) => !!el)
            .join(" "),
          score: 6,
          voluntaryToImmersion: false,
          romes: result.postes.map((poste) =>
            poste.rome.substring(poste.rome.length - 6, poste.rome.length - 1),
          ),
          siret: result.siret,
          dataSource: "api_laplateformedelinclusion",
          name: result.enseigne,
        }),
    );
  }
}
