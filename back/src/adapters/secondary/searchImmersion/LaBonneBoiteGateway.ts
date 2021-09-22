import { CompaniesGateway } from "../../../domain/searchImmersion/ports/CompaniesGateway";
import { CompanyEntity } from "../../../domain/searchImmersion/entities/CompanyEntity";
import type { SearchParams } from "../../../domain/searchImmersion/ports/SearchParams";
import axios from "axios";
import querystring from "querystring";
import { v4 as uuidV4 } from "uuid";
import { PoleEmploiAPIGateway } from "./PoleEmploiAPIGateway";
import { logger } from "../../../utils/logger";

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
  private readonly logger = logger.child({ logsource: "LaBonneBoiteGateway" });

  constructor(private poleEmploiAPIGateway: PoleEmploiAPIGateway) {}

  async getCompanies(searchParams: SearchParams): Promise<CompanyEntity[]> {
    const accessToken = await this.poleEmploiAPIGateway.getAccessToken(
      "application_PAR_limmersionfacile_61f728ccbab3458cb64ffab4d5a86f44171253d4f3d0e78bf63e01cdd438d844 api_labonneboitev1",
    );
    const headers = {
      Authorization: "Bearer " + accessToken.access_token,
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
              new CompanyEntity(
                uuidV4(),
                company.address,
                company.city,
                company.lat,
                company.lon,
                company.matched_rome_code,
                company.naf,
                company.name,
                company.siret,
                company.stars,
              ),
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
