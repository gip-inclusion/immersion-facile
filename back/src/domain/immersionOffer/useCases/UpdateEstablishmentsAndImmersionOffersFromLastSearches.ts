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
} from "../entities/EstablishmentAggregate";
import { SearchParams } from "../entities/SearchParams";
import { AdresseAPI } from "../ports/AdresseAPI";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { LaBonneBoiteAPI, LaBonneBoiteCompany } from "../ports/LaBonneBoiteAPI";
import {
  LaPlateformeDeLInclusionAPI,
  LaPlateformeDeLInclusionResult,
} from "../ports/LaPlateformeDeLInclusionAPI";
import { SearchesMadeRepository } from "../ports/SearchesMadeRepository";

const logger = createLogger(__filename);

class ExternalApiError extends Error {}

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

    const nbOfOffers = establishmentAggregates
      .map((aggregate) => aggregate.immersionOffers.length)
      .reduce((accumulator, curr) => accumulator + curr);

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

    // TODO(nsw): Parallelize once we have request throttling.
    return [
      await this.searchInternal(
        () => this.searchLaPlateformeDeLInclusion(searchParams),
        "search-la_plateforme_de_l_inclusion",
      ),
      await this.searchInternal(
        () => this.searchLaBonneBoite(searchParams),
        "search-la_bonne_boite",
      ),
    ].flat();
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
      const laBonneBoiteReleventCompanies = laBonneBoiteCompanies.filter(
        (company) => this.keepRelevantCompanies(searchParams.rome, company.naf),
      );

      // Todo : Eventually use a sequenceRunner or parallelize
      const establishmentAggregates: EstablishmentAggregate[] = [];
      for (const laBonneBoiteCompany of laBonneBoiteReleventCompanies) {
        const establishmentAggregate =
          await this.convertLaBonneBoiteCompanyToEstablishmentAggregate(
            laBonneBoiteCompany,
          );
        if (establishmentAggregate !== null)
          establishmentAggregates.push(establishmentAggregate);
      }
      return establishmentAggregates;
    } catch (error: any) {
      logger.warn("Error in searchLaBonneBoite: ", error);
      return [];
    }
  }

  private async convertLaBonneBoiteCompanyToEstablishmentAggregate(
    laBonneBoiteCompany: LaBonneBoiteCompany,
  ): Promise<EstablishmentAggregate | null> {
    const sireneAnswer = await this.sireneRepository.get(
      laBonneBoiteCompany.siret,
    );
    if (!sireneAnswer) {
      logger.warn(
        `Could not find LaBonneBoite company with siret ${laBonneBoiteCompany.siret} in Siren Gateway`,
      );
      return null;
    }

    const naf = inferNafFromSireneAnswer(sireneAnswer);
    const numberEmployeesRange =
      inferNumberEmployeesRangeFromSireneAnswer(sireneAnswer);

    const establishment: EstablishmentEntityV2 = {
      address: laBonneBoiteCompany.address,
      position: {
        lat: laBonneBoiteCompany.lat,
        lon: laBonneBoiteCompany.lon,
      },
      naf: laBonneBoiteCompany.naf ?? naf,
      dataSource: "api_labonneboite",
      numberEmployeesRange,
      name: laBonneBoiteCompany.name,
      siret: laBonneBoiteCompany.siret,
      voluntaryToImmersion: false,
    };

    const establishmentAggregate: EstablishmentAggregate = {
      establishment,

      immersionOffers: [
        {
          id: this.uuidGenerator.new(),
          rome: laBonneBoiteCompany.matched_rome_code,
          score: laBonneBoiteCompany.stars,
        },
      ],
      contacts: [],
    };
    return establishmentAggregate;
  }

  private async convertLaPlateformeDeLInclusionResultToEstablishment(
    laPlateFormeDeLInclusionResult: LaPlateformeDeLInclusionResult,
  ): Promise<EstablishmentAggregate | null> {
    const siret = laPlateFormeDeLInclusionResult.siret;

    const { addresse_ligne_1, addresse_ligne_2, code_postal, ville } =
      laPlateFormeDeLInclusionResult;

    const sireneAnswer = await this.sireneRepository.get(siret);

    if (!sireneAnswer)
      throw new ExternalApiError(
        `Could not find La Plateforme de L'Inclusion company with siret ${siret} in Siren Gateway`,
      );

    const naf = inferNafFromSireneAnswer(sireneAnswer);
    const numberEmployeesRange =
      inferNumberEmployeesRangeFromSireneAnswer(sireneAnswer);

    if (!naf)
      throw new ExternalApiError(
        `Could not retrieve naf from siret ${siret}. `,
      );

    const address = `${addresse_ligne_1} ${addresse_ligne_2} ${code_postal} ${ville}`;
    const position = await this.adresseAPI.getPositionFromAddress(address);
    if (!position)
      throw new ExternalApiError(
        `Could not retrieve position from address ${address}. Hence, cannot add establishment with siret ${siret}`,
      );

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

  private keepRelevantCompanies(
    romeSearched: string,
    companyNaf: string,
  ): boolean {
    // those conditions are business specific, see with Nathalie for any questions
    const isNafAutreServiceWithRomeElevageOrToilettage =
      companyNaf.startsWith("9609") &&
      ["A1503", "A1408"].includes(romeSearched);

    const isNafRestaurationRapideWithRomeBoulangerie =
      companyNaf == "5610C" && romeSearched == "D1102";

    const isRomeIgnoredForPublicAdministration =
      companyNaf.startsWith("8411") &&
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
      ].includes(romeSearched);

    const establishmentShouldBeIgnored =
      isNafAutreServiceWithRomeElevageOrToilettage ||
      isNafRestaurationRapideWithRomeBoulangerie ||
      isRomeIgnoredForPublicAdministration;

    if (establishmentShouldBeIgnored) {
      logger.info({ company: companyNaf }, "Not relevant, discarding.");
      return false;
    } else {
      logger.debug({ company: companyNaf }, "Relevant.");
      return true;
    }
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

      if (establishmentAggregate !== null)
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
