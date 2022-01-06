import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import {
  RetriableError,
  RetryStrategy,
} from "../../../domain/core/ports/RetryStrategy";
import { SearchParams } from "../../../domain/immersionOffer/entities/SearchParams";
import { AdresseAPI } from "../../../domain/immersionOffer/ports/AdresseAPI";
import {
  LaPlateformeDeLInclusionAPI,
  LaPlateformeDeLInclusionResult,
} from "../../../domain/immersionOffer/ports/LaPlateformeDeLInclusionAPI";
import { createAxiosInstance, logAxiosError } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";

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
  public constructor(
    private readonly adresseAPI: AdresseAPI,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

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
    const cityCode = await this.adresseAPI.getCityCodeFromPosition({
      lat: searchParams.lat,
      lon: searchParams.lon,
    });
    if (!cityCode) return { results: [] };

    return this.retryStrategy.apply(async () => {
      try {
        const axios = createAxiosInstance(logger);
        const response = await this.rateLimiter.whenReady(() =>
          axios.get("https://emplois.inclusion.beta.gouv.fr/api/v1/siaes/", {
            params: {
              code_insee: cityCode,
              distance_max_km: Math.min(
                searchParams.distance_km,
                SIAES_MAX_DISTANCE_KM,
              ),
              format: "json",
            },
          }),
        );
        return {
          results: response.data.results,
          nextPageUrl: response.data.next,
        };
      } catch (error: any) {
        if (error.response?.status == 429) {
          logger.warn("Too many requests: " + error);
          throw new RetriableError(error);
        }
        if (error.response?.status != 404) {
          logAxiosError(
            logger,
            error,
            "Could not fetch La Plate Forme de L'Inclusion API results",
          );
        }
        return { results: [] };
      }
    });
  }

  private async getNextResponse(
    url: string,
  ): Promise<LaPlateformeDeLInclusionGetResponse> {
    return this.retryStrategy.apply(async () => {
      try {
        const axios = createAxiosInstance(logger);
        const response = await this.rateLimiter.whenReady(() => axios.get(url));
        return {
          results: response.data.results,
          nextPageUrl: response.data.next,
        };
      } catch (error: any) {
        if (error.response?.status == 429) {
          logger.warn("Too many requests: " + error);
          throw new RetriableError(error);
        }
        logAxiosError(
          logger,
          error,
          "Could not fetch La Plate Forme de L'Inclusion API results when going on next page",
        );
        return { results: [] };
      }
    });
  }
}
