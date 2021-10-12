import { EstablishmentsGateway } from "../../../domain/searchImmersion/ports/EstablishmentsGateway";
import { SearchParams } from "../../../domain/searchImmersion/ports/ImmersionOfferRepository";
import axios from "axios";
import { createLogger } from "../../../utils/logger";
import { v4 as uuidV4 } from "uuid";
import { UncompleteEstablishmentEntity } from "../../../domain/searchImmersion/entities/UncompleteEstablishmentEntity";
import { APIAdresseGateway } from "./APIAdresseGateway";

const logger = createLogger(__filename);

export type EstablishmentFromLaPlateFormeDeLInclusion = {
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

export const convertLaPlateFormeDeLInclusionToUncompletEstablishment = (
  establishment: EstablishmentFromLaPlateFormeDeLInclusion,
): UncompleteEstablishmentEntity => {
  const { addresse_ligne_1, addresse_ligne_2, code_postal, ville } =
    establishment;

  return new UncompleteEstablishmentEntity({
    id: uuidV4(),
    address: `${addresse_ligne_1} ${addresse_ligne_2} ${code_postal} ${ville}`,
    city: ville,
    score: 6,
    romes: establishment.postes.map((poste) =>
      poste.rome.substring(poste.rome.length - 6, poste.rome.length - 1),
    ),
    siret: establishment.siret,
    dataSource: "api_laplateformedelinclusion",
    name: establishment.enseigne,
  });
};

export type HttpCallsToLaPlateFormeDeLInclusion = {
  getEstablishments: (
    searchParams: SearchParams,
  ) => Promise<[EstablishmentFromLaPlateFormeDeLInclusion[], string]>;
  getNextEstablishments: (
    url: string,
  ) => Promise<EstablishmentFromLaPlateFormeDeLInclusion[]>;
};

export const httpCallToLaPlateFormeDeLInclusion: HttpCallsToLaPlateFormeDeLInclusion =
  {
    getEstablishments: async (searchParams: SearchParams) => {
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
            const establishments: [
              EstablishmentFromLaPlateFormeDeLInclusion[],
              string,
            ] = [response.data.results, response.data.next];
            return establishments;
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
    getNextEstablishments: async (url: string) => {
      return axios
        .get(url)
        .then(async (response: any) => {
          if (response.data.next != null) {
            return httpCallToLaPlateFormeDeLInclusion
              .getNextEstablishments(response.data.next)
              .then((nextEstablishments) => {
                return response.data.results.concat(nextEstablishments);
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
            const results: EstablishmentFromLaPlateFormeDeLInclusion[] =
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

export class LaPlateFormeDeLInclusionGateway implements EstablishmentsGateway {
  constructor(private httpCalls: HttpCallsToLaPlateFormeDeLInclusion) {}

  async getEstablishments(
    searchParams: SearchParams,
  ): Promise<UncompleteEstablishmentEntity[]> {
    return this.httpCalls
      .getEstablishments(searchParams)
      .then(async (response: any) => {
        const establishments: EstablishmentFromLaPlateFormeDeLInclusion[] =
          response[0];
        const nextPageURL = response[1];
        return this.httpCalls
          .getNextEstablishments(nextPageURL)
          .then((nextEstablishments) =>
            establishments
              .concat(nextEstablishments)
              .map(convertLaPlateFormeDeLInclusionToUncompletEstablishment),
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
  Clean establishment data before insertion into the database with external APIs
  */
/*
  async enrichEstablishmentData(establishments: UncompleteEstablishmentEntity[]): Promise<EstablishmentEntity[]> {
    const cleanedEstablishments = [];
    for (const establishmentIndex in establishments) {
      //Adjust GPS coordinates
      const establishment = establishments[establishmentIndex];
      const gps = await this.getGPSFromAddressAPIAdresse(
        establishments[establishmentIndex].getAddress(),
      );
      establishment.setLatitude(Number(gps[0]));
      establishment.setLongitude(Number(gps[1]));

      //Get NAF from establishment

      cleanedEstablishments.push(establishment);
    }
    return cleanedEstablishments;
  }*/
