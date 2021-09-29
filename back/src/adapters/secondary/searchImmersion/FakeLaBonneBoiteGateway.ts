import { CompaniesGateway } from "../../../domain/searchImmersion/ports/CompaniesGateway";
import { CompanyEntity } from "../../../domain/searchImmersion/entities/CompanyEntity";
import type { SearchParams } from "../../../domain/searchImmersion/ports/SearchParams";
import axios from "axios";
import querystring from "querystring";
import { v4 as uuidV4 } from "uuid";
import { fakeCompanies } from "./fakeCompanies";
import { PoleEmploiAPIGateway } from "./PoleEmploiAPIGateway";
import { fakeCompaniesLaBonneBoite } from "./fakeCompaniesLaBonneBoite";
import { UncompleteCompanyEntity } from "../../../domain/searchImmersion/entities/UncompleteCompanyEntity";

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
  async getCompanies(
    searchParams: SearchParams,
  ): Promise<UncompleteCompanyEntity[]> {
    return fakeCompaniesLaBonneBoite
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
