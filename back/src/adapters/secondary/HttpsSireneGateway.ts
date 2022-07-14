import { formatISO, secondsToMilliseconds } from "date-fns";
import { SiretDto } from "shared/src/siret";
import { Clock } from "../../domain/core/ports/Clock";
import { RateLimiter } from "../../domain/core/ports/RateLimiter";
import {
  RetryableError,
  RetryStrategy,
} from "../../domain/core/ports/RetryStrategy";
import {
  SireneGateway,
  SireneGatewayAnswer,
} from "../../domain/sirene/ports/SireneGateway";
import {
  createAxiosInstance,
  isRetryableError,
  logAxiosError,
} from "../../utils/axiosUtils";
import { createLogger } from "../../utils/logger";
import { AxiosConfig } from "../primary/config/appConfig";

const logger = createLogger(__filename);

export class HttpsSireneGateway extends SireneGateway {
  public constructor(
    private readonly axiosConfig: AxiosConfig,
    private readonly clock: Clock,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {
    super();
  }

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

  protected _get = async (
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): Promise<SireneGatewayAnswer | undefined> => {
    logger.debug({ siret, includeClosedEstablishments }, "get");

    return this.retryStrategy.apply(async () => {
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
          return undefined;
        }
        if (isRetryableError(logger, error)) throw new RetryableError(error);
        logAxiosError(logger, error);
        throw error;
      }
    });
  };

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
      params.date = formatISO(this.clock.now(), { representation: "date" });
    }

    return params;
  }
}
