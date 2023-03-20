import { secondsToMilliseconds, formatISO } from "date-fns";
import { SiretDto } from "shared";

import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import {
  RetryableError,
  RetryStrategy,
} from "../../../domain/core/ports/RetryStrategy";
import { TimeGateway } from "../../../domain/core/ports/TimeGateway";
import {
  SirenGatewayAnswer,
  SirenGateway,
} from "../../../domain/sirene/ports/SirenGateway";
import {
  createAxiosInstance,
  isRetryableError,
  logAxiosError,
} from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import { AxiosConfig } from "../../primary/config/appConfig";
import {
  TooManyRequestApiError,
  UnavailableApiError,
} from "../../primary/helpers/httpErrors";

const logger = createLogger(__filename);

export class HttpSirenGateway implements SirenGateway {
  public constructor(
    private readonly axiosConfig: AxiosConfig,
    private readonly timeGateway: TimeGateway,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

  private createAxiosInstance() {
    return createAxiosInstance(logger, {
      baseURL: this.axiosConfig.endpoint,
      headers: {
        Authorization: `Bearer ${this.axiosConfig.bearerToken}`,
        Accept: "application/json",
      },
      timeout: secondsToMilliseconds(10),
    });
  }

  public async getEstablishmentBySiret(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): Promise<SirenGatewayAnswer | undefined> {
    logger.debug({ siret, includeClosedEstablishments }, "get");

    return this.retryStrategy
      .apply(async () => {
        try {
          const axios = this.createAxiosInstance();
          const response = await this.rateLimiter.whenReady(() =>
            axios.get("/siret", {
              params: this.createSiretQueryParams(
                siret,
                includeClosedEstablishments,
              ),
            }),
          );
          return response?.data;
        } catch (error: any) {
          if (error.response?.status === 404) {
            return;
          }
          if (isRetryableError(logger, error)) throw new RetryableError(error);
          logAxiosError(logger, error);
          throw error;
        }
      })
      .catch((error) => {
        const serviceName = "Sirene API";
        logger.error({ siret, error }, "Error fetching siret");
        if (error?.initialError?.status === 429)
          throw new TooManyRequestApiError(serviceName);
        throw new UnavailableApiError(serviceName);
      });
  }

  private createSiretQueryParams(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ) {
    const params: any = {
      q: `siret:${siret}`,
    };

    // According to API SIRENE documentation :
    // etatAdministratifEtablissement :
    //   État de l'établissement pendant la période :
    //     A= établissement actif
    //     F= établissement fermé
    if (!includeClosedEstablishments) {
      params.q += " AND periode(etatAdministratifEtablissement:A)";
      params.date = formatISO(this.timeGateway.now(), {
        representation: "date",
      });
    }

    return params;
  }
}
