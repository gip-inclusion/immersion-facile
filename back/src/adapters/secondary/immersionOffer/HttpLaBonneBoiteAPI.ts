import { secondsToMilliseconds } from "date-fns";
import { AccessTokenGateway } from "../../../domain/core/ports/AccessTokenGateway";
import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import {
  RetriableError,
  RetryStrategy,
} from "../../../domain/core/ports/RetryStrategy";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteRequestParams,
} from "../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import {
  LaBonneBoiteCompanyProps,
  LaBonneBoiteCompanyVO,
} from "../../../domain/immersionOffer/valueObjects/LaBonneBoiteCompanyVO";
import {
  createAxiosInstance,
  isRetriableError,
  logAxiosError,
} from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class HttpLaBonneBoiteAPI implements LaBonneBoiteAPI {
  constructor(
    private readonly accessTokenGateway: AccessTokenGateway,
    private readonly poleEmploiClientId: string,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

  public async searchCompanies(
    searchParams: LaBonneBoiteRequestParams,
  ): Promise<LaBonneBoiteCompanyVO[]> {
    return this.retryStrategy.apply(async () => {
      try {
        const axios = createAxiosInstance(logger);
        const response = await this.rateLimiter.whenReady(async () => {
          const accessToken = await this.accessTokenGateway.getAccessToken(
            `application_${this.poleEmploiClientId} api_labonneboitev1`,
          );
          return axios.get(
            "https://api.emploi-store.fr/partenaire/labonneboite/v1/company/",
            {
              headers: {
                Authorization: createAuthorization(accessToken.access_token),
              },
              timeout: secondsToMilliseconds(10),
              params: {
                distance: searchParams.distance_km,
                longitude: searchParams.lon,
                latitude: searchParams.lat,
                ...(searchParams.rome ? { rome_codes: searchParams.rome } : {}),
              },
            },
          );
        });
        return (response.data.companies || []).map(
          (props: LaBonneBoiteCompanyProps) => new LaBonneBoiteCompanyVO(props),
        );
      } catch (error: any) {
        if (isRetriableError(logger, error)) throw new RetriableError(error);
        logAxiosError(logger, error);
        throw error;
      }
    });
  }
}

const createAuthorization = (accessToken: string) => `Bearer ${accessToken}`;
