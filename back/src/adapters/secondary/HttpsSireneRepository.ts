import { formatISO } from "date-fns";
import { Clock } from "../../domain/core/ports/Clock";
import { RateLimiter } from "../../domain/core/ports/RateLimiter";
import { RetryStrategy } from "../../domain/core/ports/RetryStrategy";
import {
  SireneRepository,
  SireneRepositoryAnswer,
} from "../../domain/sirene/ports/SireneRepository";
import { SiretDto } from "../../shared/siret";
import { createAxiosInstance, logAxiosError } from "../../utils/axiosUtils";
import { createLogger } from "../../utils/logger";
import { AxiosConfig } from "../primary/appConfig";

const logger = createLogger(__filename);

export class HttpsSireneRepository implements SireneRepository {
  public constructor(
    private readonly axiosConfig: AxiosConfig,
    private readonly clock: Clock,
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
    });
  }

  public async get(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ): Promise<SireneRepositoryAnswer | undefined> {
    logger.debug({ siret, includeClosedEstablishments }, "get");

    try {
      const axios = this.createAxiosInstance();
      const response = await this.retryStrategy.apply(() =>
        this.rateLimiter.whenReady(() =>
          axios.get("/siret", {
            params: this.createSiretQueryParams(
              siret,
              includeClosedEstablishments,
            ),
          }),
        ),
      );
      return response.data;
    } catch (error: any) {
      logAxiosError(logger, error);
      if (error.response.status == 404) {
        return undefined;
      }
      throw error;
    }
  }

  private createSiretQueryParams(
    siret: SiretDto,
    includeClosedEstablishments = false,
  ) {
    const params: any = {
      q: `siret:${siret}`,
    };

    // According to API SIRENE documentation:
    // etatAdministratifEtablissement:
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
