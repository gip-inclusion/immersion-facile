import { CompaniesGateway } from "../../../domain/searchImmersion/ports/CompaniesGateway";
import { SearchParams } from "../../../domain/searchImmersion/ports/SearchParams";
import { CompanyEntity } from "../../../domain/searchImmersion/entities/CompanyEntity";
import axios from "axios";
import { logger } from "../../../utils/logger";
import { v4 as uuidV4 } from "uuid";
import { string } from "yup/lib/locale";

type CompanyFromLaPlateFormeDeLInclusion = {
  cree_le: Date;
  mis_a_jour_le: Date;

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
  cree_le: Date;
  mis_a_jour_le: Date;
  recrutement_ouvert: string;
  description: string;
  appellation_modifiee: string;
};

export class LaPlateFormeDeLInclusionGateway implements CompaniesGateway {
  private readonly logger = logger.child({
    logsource: "LaPlateFormeDeLInclusionGateway",
  });

  async getCompanies(searchParams: SearchParams): Promise<CompanyEntity[]> {
    var cityCode = await this.getCityCodeFromLatLongAPIAdresse(
      searchParams.lat,
      searchParams.long,
    );
    if (cityCode == -1) {
      return [];
    } else {
      return axios
        .get("https://emplois.inclusion.beta.gouv.fr/api/v1/siaes/", {
          params: {
            code_insee: cityCode,
            distance_max_km: searchParams.distance,
            format: "json",
          },
        })
        .then(async (response: any) => {
          const companies: CompanyFromLaPlateFormeDeLInclusion[] =
            response.data.results;
          var nextPageURL = response.data.next;
          return this.getNextCompanies(nextPageURL)
            .then((nextCompanies) => {
              return companies
                .concat(nextCompanies)
                .map((company: CompanyFromLaPlateFormeDeLInclusion) => {
                  const companyEntity =
                    this.mapCompanyFromLaPlateFormeDeLInclusionToCompanyEntity(
                      company,
                    );
                  companyEntity.setLatitude(searchParams.lat);
                  companyEntity.setLongitude(searchParams.long);
                  return companyEntity;
                });
            })
            .catch(function (error: any) {
              // handle error
              logger.error(
                error,
                "Could not fetch La Plate Forme de L'Inclusion API results",
              );
              return [];
            });
        })
        .catch(function (error: any) {
          // handle error
          logger.error(
            error,
            "Could not fetch La Plate Forme de L'Inclusion API results",
          );
          return [];
        });
    }
  }

  async getNextCompanies(
    url: string,
  ): Promise<CompanyFromLaPlateFormeDeLInclusion[]> {
    var nextPageURL = url;
    return axios
      .get(nextPageURL)
      .then(async (response: any) => {
        if (response.data.next != null) {
          return this.getNextCompanies(response.data.next)
            .then((nextCompanies) => {
              return response.data.results.concat(nextCompanies);
            })
            .catch(function (error: any) {
              // handle error
              logger.error(
                error,
                "Could not fetch La Plate Forme de L'Inclusion API results when going on next page",
              );
              nextPageURL = "null";
              return [];
            });
        } else {
          return response.data.results;
        }
      })
      .catch(function (error: any) {
        // handle error
        logger.error(
          error,
          "Could not fetch La Plate Forme de L'Inclusion API results when going on next page",
        );
        nextPageURL = "null";
        return [];
      });
  }

  /*
  Clean company data before insertion into the database with external APIs
  */
  async cleanCompanyData(companies: CompanyEntity[]): Promise<CompanyEntity[]> {
    const cleanedCompanies = [];
    for (const companyIndex in companies) {
      //Adjust GPS coordinates
      const company = companies[companyIndex];
      const gps = await this.getGPSFromAddressAPIAdresse(
        companies[companyIndex].getAddress(),
      );
      company.setLatitude(Number(gps[0]));
      company.setLongitude(Number(gps[1]));

      //Get NAF from company

      cleanedCompanies.push(company);
    }
    return cleanedCompanies;
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
      "LaPlateFormeDeLInclusion",
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
