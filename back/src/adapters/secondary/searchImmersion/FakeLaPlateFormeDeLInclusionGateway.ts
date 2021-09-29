import { CompaniesGateway } from "../../../domain/searchImmersion/ports/CompaniesGateway";
import { SearchParams } from "../../../domain/searchImmersion/ports/SearchParams";
import { CompanyEntity } from "../../../domain/searchImmersion/entities/CompanyEntity";
import axios from "axios";
import { logger } from "../../../utils/logger";
import { v4 as uuidV4 } from "uuid";
import { string } from "yup/lib/locale";
import { fakeCompaniesLaPlateFormeDeLInclusion } from "./fakeCompaniesLaPlateFormeDeLInclusion";

export type CompanyFromLaPlateFormeDeLInclusion = {
  cree_le: string;
  mis_a_jour_le: string;

  siret: string;
  type: string;
  raison_sociale: string;
  enseigne: string;
  site_web: string;
  description: string;
  bloque_candidatures: boolean;
  addresse_ligne_1: string;
  addresse_ligne_2: string;
  code_postal: string;
  ville: string;
  departement: string;
  postes: JobFromLaPlateFormeDeLInclusion[];
};
type JobFromLaPlateFormeDeLInclusion = {
  id: number;
  rome: string;
  cree_le: string;
  mis_a_jour_le: string;
  recrutement_ouvert: string;
  description: string;
  appellation_modifiee: string;
};

export class FakeLaPlateFormeDeLInclusionGateway implements CompaniesGateway {
  private readonly logger = logger.child({
    logsource: "LaPlateFormeDeLInclusionGateway",
  });

  async getCompanies(searchParams: SearchParams): Promise<CompanyEntity[]> {
    var companies: CompanyFromLaPlateFormeDeLInclusion[] =
      fakeCompaniesLaPlateFormeDeLInclusion;
    return fakeCompaniesLaPlateFormeDeLInclusion.map((company) =>
      this.mapCompanyFromLaPlateFormeDeLInclusionToCompanyEntity(company),
    );
  }

  /*
  Clean company data before insertion into the database with external APIs
  */
  async cleanCompanyData(companies: CompanyEntity[]): Promise<CompanyEntity[]> {
    return companies;
  }

  mapCompanyFromLaPlateFormeDeLInclusionToCompanyEntity(
    company: CompanyFromLaPlateFormeDeLInclusion,
  ): CompanyEntity {
    return new CompanyEntity(
      uuidV4(),
      company.addresse_ligne_1 +
        " " +
        company.addresse_ligne_2 +
        " " +
        company.code_postal +
        " " +
        company.ville,
      -1,
      company.ville,
      -1,
      -1,
      "",
      company.enseigne,
      company.siret,
      5,
      company.postes.map((poste) =>
        poste.rome.substring(poste.rome.length - 6, poste.rome.length - 1),
      ),
      "api_laplateformedelinclusion",
    );
  }

  async getGPSFromAddressAPIAdresse(address: string) {
    return axios
      .get("https://api-adresse.data.gouv.fr/search/", {
        params: {
          q: address,
        },
      })
      .then((response: any) => {
        return response.data.features[0].geometry.coordinates;
      })
      .catch(function (error: any) {
        return [-1, -1];
      });
  }
  /*
    Returns city code from latitude and longitude parameters using the api-adresse API from data.gouv
    Returns -1 if did not find
    */
  async getCityCodeFromLatLongAPIAdresse(
    lat: number,
    lon: number,
  ): Promise<number> {
    return axios
      .get("https://api-adresse.data.gouv.fr/reverse/", {
        params: {
          lon: lon,
          lat: lat,
        },
      })
      .then((response: any) => {
        if (response.data.features.length != 0)
          return response.data.features[0].properties.citycode;
        else return -1;
      })
      .catch(function (error: any) {
        return -1;
      });
  }
}
