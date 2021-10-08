import { CompaniesGateway } from "../../../domain/searchImmersion/ports/CompaniesGateway";
import { SearchParams } from "../../../domain/searchImmersion/ports/ImmersionOfferRepository";
import axios from "axios";
import { createLogger } from "../../../utils/logger";
import { v4 as uuidV4 } from "uuid";
import { UncompleteCompanyEntity } from "../../../domain/searchImmersion/entities/UncompleteCompanyEntity";
import { APIAdresseGateway } from "./APIAdresseGateway";

const logger = createLogger(__filename);

export type CompanyFromLaPlateFormeDeLInclusion = {
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

export type JobFromLaPlateFormeDeLInclusion = {
  id: number;
  rome: string;
  cree_le: Date;
  mis_a_jour_le: Date;
  recrutement_ouvert: string;
  description: string;
  appellation_modifiee: string;
};

export const convertLaPlateFormeDeLInclusionToUncompletCompany = (
  company: CompanyFromLaPlateFormeDeLInclusion,
): UncompleteCompanyEntity => {
  const { addresse_ligne_1, addresse_ligne_2, code_postal, ville } = company;

  return new UncompleteCompanyEntity({
    id: uuidV4(),
    address: `${addresse_ligne_1} ${addresse_ligne_2} ${code_postal} ${ville}`,
    city: ville,
    score: 6,
    romes: company.postes.map((poste) =>
      poste.rome.substring(poste.rome.length - 6, poste.rome.length - 1),
    ),
    siret: company.siret,
    dataSource: "api_laplateformedelinclusion",
    name: company.enseigne,
  });
};

export type HttpCallsToLaPlateFormeDeLInclusion = {
  getCompanies: (
    searchParams: SearchParams,
  ) => Promise<[CompanyFromLaPlateFormeDeLInclusion[], String]>;
  getNextCompanies: (
    url: string,
  ) => Promise<CompanyFromLaPlateFormeDeLInclusion[]>;
};

export const httpCallToLaPlateFormeDeLInclusion: HttpCallsToLaPlateFormeDeLInclusion =
  {
    getCompanies: async (searchParams: SearchParams) => {
      const apiAdresseGateway = new APIAdresseGateway();
      const cityCode = await apiAdresseGateway.getCityCodeFromLatLongAPIAdresse(
        searchParams.lat,
        searchParams.lon,
      );
      if (cityCode == -1) {
        return [[], ""];
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
            const companies: [CompanyFromLaPlateFormeDeLInclusion[], String] = [
              response.data.results,
              response.data.next,
            ];
            return companies;
          })
          .catch(function (error: any) {
            // handle error
            logger.error(
              error,
              "Could not fetch La Plate Forme de L'Inclusion API results",
            );
            return [[], ""];
          });
      }
    },
    getNextCompanies: async (url: string) => {
      return axios
        .get(url)
        .then(async (response: any) => {
          if (response.data.next != null) {
            return httpCallToLaPlateFormeDeLInclusion
              .getNextCompanies(response.data.next)
              .then((nextCompanies) => {
                return response.data.results.concat(nextCompanies);
              })
              .catch(function (error: any) {
                // handle error
                logger.error(
                  error,
                  "Could not fetch La Plate Forme de L'Inclusion API results when going on next page",
                );
                return [];
              });
          } else {
            var results: CompanyFromLaPlateFormeDeLInclusion[] =
              response.data.results;
            return results;
          }
        })
        .catch(function (error: any) {
          // handle error
          logger.error(
            error,
            "Could not fetch La Plate Forme de L'Inclusion API results when going on next page",
          );
          return [];
        });
    },
  };

export class LaPlateFormeDeLInclusionGateway implements CompaniesGateway {
  constructor(private httpCalls: HttpCallsToLaPlateFormeDeLInclusion) {}

  async getCompanies(
    searchParams: SearchParams,
  ): Promise<UncompleteCompanyEntity[]> {
    return this.httpCalls
      .getCompanies(searchParams)
      .then(async (response: any) => {
        const companies: CompanyFromLaPlateFormeDeLInclusion[] = response[0];
        const nextPageURL = response[1];
        return this.httpCalls
          .getNextCompanies(nextPageURL)
          .then((nextCompanies) =>
            companies
              .concat(nextCompanies)
              .map(convertLaPlateFormeDeLInclusionToUncompletCompany),
          )
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

/*
  Clean company data before insertion into the database with external APIs
  */
/*
  async enrichCompanyData(companies: UncompleteCompanyEntity[]): Promise<CompanyEntity[]> {
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
  }*/
