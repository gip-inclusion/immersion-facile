import { CompaniesGateway } from "../../../domain/searchImmersion/ports/CompaniesGateway";
import { CompanyEntity } from "../../../domain/searchImmersion/entities/CompanyEntity";
import type { SearchParams } from "../../../domain/searchImmersion/ports/SearchParams";
import axios from "axios";
import querystring from "querystring";
import { v4 as uuidV4 } from "uuid";
import { logger } from "../../../utils/logger";
import { fakeCompanies } from "./fakeCompanies";

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

export class FakeLaBonneBoiteGateway implements CompaniesGateway {
  private readonly logger = logger.child({
    logsource: "FakeLaBonneBoiteGateway",
  });

  async getCompanies(searchParams: SearchParams): Promise<CompanyEntity[]> {
    return fakeCompanies
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
