import { createLogger } from "../../../utils/logger";
import { PipelineStats } from "../../../utils/pipelineStats";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import {
  SireneRepository,
  SireneRepositoryAnswer,
} from "../../sirene/ports/SireneRepository";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
  TefenCode,
} from "../entities/EstablishmentEntity";
import { SearchParams } from "../entities/SearchParams";
import { AdresseAPI } from "../ports/AdresseAPI";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { LaBonneBoiteAPI } from "../ports/LaBonneBoiteAPI";
import {
  LaPlateformeDeLInclusionAPI,
  LaPlateformeDeLInclusionResult,
} from "../ports/LaPlateformeDeLInclusionAPI";
import { SearchesMadeRepository } from "../ports/SearchesMadeRepository";
import { LaBonneBoiteCompanyVO } from "../valueObjects/LaBonneBoiteCompanyVO";

const logger = createLogger(__filename);

const scoreForLaPlateFormeDeLInclusionOffer = 6; // This is arbitraty /!\
export class UpdateEstablishmentsAndImmersionOffersFromLastSearches {
  public readonly stats = new PipelineStats(this.constructor.name);

  constructor(
    private readonly uuidGenerator: UuidGenerator,
    private readonly laBonneBoiteAPI: LaBonneBoiteAPI,
    private readonly laPlateFormeDeLInclusionAPI: LaPlateformeDeLInclusionAPI,
    private readonly adresseAPI: AdresseAPI,
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

    for (const searchParams of searchesMade) {
      await this.processSearchMade(searchParams);
    }
  }

  private async processSearchMade(searchParams: SearchParams) {
    logger.debug({ searchParams }, "processSearchMade");
    this.stats.incCounter("process_search_made-total");
    this.stats.startAggregateTimer("process_search_made-latency");

    // Check if we have potential immersions in our available databases.
    const establishmentAggregates = await this.search(searchParams);

    const nbOfOffers = establishmentAggregates.reduce(
      (acc, aggregate) => acc + aggregate.immersionOffers.length,
      0,
    );

    logger.info(
      { searchParams },
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
    searchParams: SearchParams,
  ): Promise<EstablishmentAggregate[]> {
    this.stats.incCounter("search-total");

    const establishmentAggregateLists = await Promise.all([
      this.searchInternal(
        () => this.searchLaPlateformeDeLInclusion(searchParams),
        "search-la_plateforme_de_l_inclusion",
      ),
      this.searchInternal(
        () => this.searchLaBonneBoite(searchParams),
        "search-la_bonne_boite",
      ),
    ]);

    return establishmentAggregateLists.flat();
  }

  private async searchInternal(
    searchFn: () => Promise<EstablishmentAggregate[]>,
    counterNamePrefix: string,
  ): Promise<EstablishmentAggregate[]> {
    this.stats.startAggregateTimer(`${counterNamePrefix}-latency`);
    const establishments = await searchFn();
    this.stats.stopAggregateTimer(`${counterNamePrefix}-latency`);

    this.stats.recordSample(
      `${counterNamePrefix}-establishments_found`,
      establishments.length,
    );
    return establishments;
  }

  private async searchLaBonneBoite(
    searchParams: SearchParams,
  ): Promise<EstablishmentAggregate[]> {
    try {
      const laBonneBoiteCompanies = await this.laBonneBoiteAPI.searchCompanies(
        searchParams,
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

  private async convertLaPlateformeDeLInclusionResultToEstablishment(
    laPlateFormeDeLInclusionResult: LaPlateformeDeLInclusionResult,
  ): Promise<EstablishmentAggregate | undefined> {
    const siret = laPlateFormeDeLInclusionResult.siret;

    const { addresse_ligne_1, addresse_ligne_2, code_postal, ville } =
      laPlateFormeDeLInclusionResult;

    const sireneAnswer = await this.sireneRepository.get(siret);

    if (!sireneAnswer) {
      logger.warn({ siret }, "Company not found in SIRENE.");
      return;
    }

    const naf = inferNafFromSireneAnswer(sireneAnswer);
    const numberEmployeesRange =
      inferNumberEmployeesRangeFromSireneAnswer(sireneAnswer);

    if (!naf) {
      logger.warn({ sireneAnswer }, "Unable to retrieve NAF");
      return;
    }

    const address = `${addresse_ligne_1} ${addresse_ligne_2} ${code_postal} ${ville}`;
    const position = await this.adresseAPI.getPositionFromAddress(address);
    if (!position) {
      logger.warn(
        { siret, address },
        "Unable to retrieve position from API Adresse",
      );
      return;
    }

    const establishment: EstablishmentEntityV2 = {
      address,
      voluntaryToImmersion: false,
      siret,
      dataSource: "api_laplateformedelinclusion",
      name: laPlateFormeDeLInclusionResult.enseigne,
      numberEmployeesRange,
      position,
      naf,
    };
    const establishmentAggregate: EstablishmentAggregate = {
      establishment,
      contacts: [],
      immersionOffers: laPlateFormeDeLInclusionResult.postes.map((poste) => ({
        id: this.uuidGenerator.new(),
        rome: poste.rome,
        score: scoreForLaPlateFormeDeLInclusionOffer,
      })),
    };
    return establishmentAggregate;
  }

  private async searchLaPlateformeDeLInclusion(
    searchParams: SearchParams,
  ): Promise<EstablishmentAggregate[]> {
    const laPlateFormeDeLInclusionResults =
      await this.laPlateFormeDeLInclusionAPI.getResults(searchParams);

    // Todo : Eventually use a sequenceRunner or parallelize
    const establishmentAggregates: EstablishmentAggregate[] = [];
    for (const laPlateFormeDeLInclusionResult of laPlateFormeDeLInclusionResults) {
      const establishmentAggregate =
        await this.convertLaPlateformeDeLInclusionResultToEstablishment(
          laPlateFormeDeLInclusionResult,
        );

      if (!!establishmentAggregate)
        establishmentAggregates.push(establishmentAggregate);
    }
    return establishmentAggregates;
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
