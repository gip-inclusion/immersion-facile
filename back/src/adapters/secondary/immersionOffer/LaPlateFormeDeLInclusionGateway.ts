import { v4 as uuidV4 } from "uuid";
import { UncompleteEstablishmentEntity } from "../../../domain/immersionOffer/entities/UncompleteEstablishmentEntity";
import { EstablishmentsGateway } from "../../../domain/immersionOffer/ports/EstablishmentsGateway";
import { SearchParams } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { createAxiosInstance, logAxiosError } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import { APIAdresseGateway } from "./APIAdresseGateway";

const logger = createLogger(__filename);

// The maximum number of response pages to fetch from the API of la plateforme de l'inclusion.
const MAX_PAGE_READS = 20;

// The maximum distance accepted by the API of la plateforme de l'inclusion.
const SIAES_MAX_DISTANCE_KM = 100;

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
    score: 6,
    voluntaryToImmersion: false,
    romes: establishment.postes.map((poste) =>
      poste.rome.substring(poste.rome.length - 6, poste.rome.length - 1),
    ),
    siret: establishment.siret,
    dataSource: "api_laplateformedelinclusion",
    name: establishment.enseigne,
  });
};

export type GetEstablishmentsResponse = {
  results: EstablishmentFromLaPlateFormeDeLInclusion[];
  nextPageUrl?: string;
};
export type HttpCallsToLaPlateFormeDeLInclusion = {
  getEstablishments: (
    searchParams: SearchParams,
  ) => Promise<GetEstablishmentsResponse>;
  getNextEstablishments: (url: string) => Promise<GetEstablishmentsResponse>;
};

export const httpCallToLaPlateFormeDeLInclusion: HttpCallsToLaPlateFormeDeLInclusion =
  {
    getEstablishments: async (
      searchParams: SearchParams,
    ): Promise<GetEstablishmentsResponse> => {
      const apiAdresseGateway = new APIAdresseGateway();
      const cityCode = await apiAdresseGateway.getCityCodeFromLatLongAPIAdresse(
        searchParams.lat,
        searchParams.lon,
      );
      if (cityCode == -1) return { results: [] };

      try {
        const response = await createAxiosInstance(logger).get(
          "https://emplois.inclusion.beta.gouv.fr/api/v1/siaes/",
          {
            params: {
              code_insee: cityCode,
              distance_max_km: Math.min(
                searchParams.distance_km,
                SIAES_MAX_DISTANCE_KM,
              ),
              format: "json",
            },
          },
        );
        return {
          results: response.data.results,
          nextPageUrl: response.data.next,
        };
      } catch (error: any) {
        logAxiosError(
          logger,
          error,
          "Could not fetch La Plate Forme de L'Inclusion API results",
        );
        return { results: [] };
      }
    },
    getNextEstablishments: async (
      url: string,
    ): Promise<GetEstablishmentsResponse> => {
      try {
        const response = await createAxiosInstance(logger).get(url);
        return {
          results: response.data.results,
          nextPageUrl: response.data.next,
        };
      } catch (error: any) {
        logAxiosError(
          logger,
          error,
          "Could not fetch La Plate Forme de L'Inclusion API results when going on next page",
        );
        return { results: [] };
      }
    },
  };

export class LaPlateFormeDeLInclusionGateway implements EstablishmentsGateway {
  constructor(private httpCalls: HttpCallsToLaPlateFormeDeLInclusion) {}

  async getEstablishments(
    searchParams: SearchParams,
  ): Promise<UncompleteEstablishmentEntity[]> {
    logger.debug({ searchParams }, "getEstablishments");

    let page = await this.httpCalls.getEstablishments(searchParams);
    let pageReads = 0;
    let results = [...page.results];

    while (page.nextPageUrl) {
      if (pageReads >= MAX_PAGE_READS) {
        logger.warn(
          `Reached page limit (${pageReads}) but more pages are available.`,
        );
        break;
      }
      page = await this.httpCalls.getNextEstablishments(page.nextPageUrl);
      pageReads++;
      results = [...results, ...page.results];
    }

    return results.map(convertLaPlateFormeDeLInclusionToUncompletEstablishment);
  }
}
