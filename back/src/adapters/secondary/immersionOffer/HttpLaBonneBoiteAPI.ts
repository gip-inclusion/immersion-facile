import { AccessTokenGateway } from "../../../domain/core/ports/AccessTokenGateway";
import {
  RetriableError,
  RetryStrategy,
} from "../../../domain/core/ports/RetryStrategy";
import { SearchParams } from "../../../domain/immersionOffer/entities/SearchParams";
import { LaBonneBoiteAPI } from "../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { LaBonneBoiteCompanyVO } from "../../../domain/immersionOffer/valueObjects/LaBonneBoiteCompanyVO";
import { createAxiosInstance, logAxiosError } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import { RateLimiter } from "../../../domain/core/ports/RateLimiter";

const logger = createLogger(__filename);

export class HttpLaBonneBoiteAPI implements LaBonneBoiteAPI {
  constructor(
    private readonly accessTokenGateway: AccessTokenGateway,
    private readonly poleEmploiClientId: string,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

  public async searchCompanies(
    searchParams: SearchParams,
  ): Promise<LaBonneBoiteCompanyVO[]> {
    return this.retryStrategy.apply(async () => {
      const accessToken = await this.accessTokenGateway.getAccessToken(
        `application_${this.poleEmploiClientId} api_labonneboitev1`,
      );
      try {
        const axios = createAxiosInstance(logger);
        const response = await this.rateLimiter.whenReady(() =>
          axios.get(
            "https://api.emploi-store.fr/partenaire/labonneboite/v1/company/",
            {
              headers: {
                Authorization: createAuthorization(accessToken.access_token),
              },
              params: {
                distance: searchParams.distance_km,
                longitude: searchParams.lon,
                latitude: searchParams.lat,
                rome_codes: searchParams.rome,
              },
            },
          ),
        );
        return response.data.companies || [];
      } catch (error: any) {
        if (error.response.status == 429) {
          logger.warn("Too many requests: " + error);
          throw new RetriableError(error);
        }
        logAxiosError(logger, error, "Error calling labonneboite API");
        throw error;
      }
    });
  }
}

const createAuthorization = (accessToken: string) => `Bearer ${accessToken}`;
