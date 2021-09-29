import axios from "axios";
import { v4 as uuidV4 } from "uuid";
import { AccessTokenGateway } from "../../../domain/core/ports/AccessTokenGateway";
import { CompanyEntity } from "../../../domain/searchImmersion/entities/CompanyEntity";
import { CompaniesGateway } from "../../../domain/searchImmersion/ports/CompaniesGateway";
import type { SearchParams } from "../../../domain/searchImmersion/ports/SearchParams";
import { createLogger } from "../../../utils/logger";
import { PoleEmploiAPIGateway } from "./PoleEmploiAPIGateway";
import { UncompleteCompanyEntity } from "../../../domain/searchImmersion/entities/UncompleteCompanyEntity";

const logger = createLogger(__filename);

type CompanyFromLaBonneBoite = {
  address: string;
  city: string;
  lat: number;
  lon: number;
  matched_rome_code: string;
  naf: string;
  name: string;
  siret: string;
  stars: number;
};

export class LaBonneBoiteGateway implements CompaniesGateway {
  constructor(
    private readonly accessTokenGateway: AccessTokenGateway,
    private readonly poleEmploiClientId: string,
  ) {}

  async getCompanies(searchParams: SearchParams): Promise<CompanyEntity[]> {
    const response = await this.accessTokenGateway.getAccessToken(
      `application_${this.poleEmploiClientId} api_labonneboitev1`,
    );
    const headers = {
      Authorization: "Bearer " + response.access_token,
    };
    console.log("Above to fetch");
    return axios
      .get(
        "https://api.emploi-store.fr/partenaire/labonneboite/v1/company/",

        {
          headers: headers,
          params: {
            distance: searchParams.distance,
            longitude: searchParams.long,
            latitude: searchParams.lat,
            rome_codes: searchParams.ROME,
          },
        },
      )
      .then((response: any) => {
        const companies: CompanyFromLaBonneBoite[] = response.data.companies;
        return companies
          .filter((company) =>
            this.keepRelevantCompanies(searchParams.ROME, company),
          )
          .map(
            (company) =>
              new UncompleteCompanyEntity({
                id: uuidV4(),
                address: company.address,
                city: company.city,
                position: { lat: company.lat, lon: company.lon },
                naf: company.naf,
                name: company.name,
                siret: company.siret,
                score: company.stars,
                romes: [company.matched_rome_code],
                dataSource: "api_labonneboite",
              }),
          );
      })
      .catch(function (error: any) {
        // handle error
        logger.error(error, "Could not fetch La Bonne Boite API results");
        return [];
      });
  }

  keepRelevantCompanies(
    romeSearched: string,
    company: CompanyFromLaBonneBoite,
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
      return false;
    } else {
      return true;
    }
  }
}
