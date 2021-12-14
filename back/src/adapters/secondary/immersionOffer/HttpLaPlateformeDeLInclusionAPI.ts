import { SearchParams } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import {
  LaPlateformeDeLInclusionAPI,
  LaPlateformeDeLInclusionResult,
} from "../../../domain/immersionOffer/ports/LaPlateformeDeLInclusionAPI";
import { createAxiosInstance, logAxiosError } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import { APIAdresseGateway } from "./APIAdresseGateway";

const logger = createLogger(__filename);

// The maximum number of response pages to fetch from the API of la plateforme de l'inclusion.
const MAX_PAGE_READS = 20;
// The maximum distance accepted by the API of la plateforme de l'inclusion.
const SIAES_MAX_DISTANCE_KM = 100;

type LaPlateformeDeLInclusionGetResponse = {
  results: LaPlateformeDeLInclusionResult[];
  nextPageUrl?: string;
};

export class HttpLaPlateformeDeLInclusionAPI
  implements LaPlateformeDeLInclusionAPI
{
  public constructor(private readonly apiAdresseGateway: APIAdresseGateway) {}

  public async getResults(
    searchParams: SearchParams,
  ): Promise<LaPlateformeDeLInclusionResult[]> {
    logger.debug({ searchParams }, "getEstablishments");

    let page = await this.getFirstResponse(searchParams);
    let pageReads = 0;
    let results = [...page.results];

    while (page.nextPageUrl) {
      if (pageReads >= MAX_PAGE_READS) {
        logger.warn(
          `Reached page limit (${pageReads}) but more pages are available.`,
        );
        break;
      }
      page = await this.getNextResponse(page.nextPageUrl);
      pageReads++;
      results = [...results, ...page.results];
    }
    return results;
  }

  private async getFirstResponse(
    searchParams: SearchParams,
  ): Promise<LaPlateformeDeLInclusionGetResponse> {
    const cityCode =
      await this.apiAdresseGateway.getCityCodeFromLatLongAPIAdresse(
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
  }

  private async getNextResponse(
    url: string,
  ): Promise<LaPlateformeDeLInclusionGetResponse> {
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
  }
}
