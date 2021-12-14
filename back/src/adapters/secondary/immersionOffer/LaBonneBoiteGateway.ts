import { v4 as uuidV4 } from "uuid";
import { UncompleteEstablishmentEntity } from "../../../domain/immersionOffer/entities/UncompleteEstablishmentEntity";
import { EstablishmentsGateway } from "../../../domain/immersionOffer/ports/EstablishmentsGateway";
import type { SearchParams } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { logAxiosError } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteCompany,
} from "./../../../domain/immersionOffer/ports/LaBonneBoiteAPI";

const logger = createLogger(__filename);

export class LaBonneBoiteGateway implements EstablishmentsGateway {
  constructor(private readonly laBonneBoiteApi: LaBonneBoiteAPI) {}

  public async getEstablishments(
    searchParams: SearchParams,
  ): Promise<UncompleteEstablishmentEntity[]> {
    logger.debug({ searchParams }, "getEstablishments");
    try {
      const laBonneBoiteResponse = await this.laBonneBoiteApi.searchCompanies(
        searchParams,
      );

      return laBonneBoiteResponse
        .filter((company) =>
          this.keepRelevantCompanies(searchParams.rome, company),
        )
        .map(
          (company) =>
            new UncompleteEstablishmentEntity({
              id: uuidV4(),
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
      logAxiosError(
        logger,
        error,
        "Could not fetch La Bonne Boite API results",
      );
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
}
