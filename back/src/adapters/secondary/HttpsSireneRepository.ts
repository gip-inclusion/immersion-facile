import axios, { AxiosInstance } from "axios";
import {
  SireneRepository,
  SireneRepositoryAnswer,
} from "../../domain/sirene/ports/SireneRepository";
import { createLogger } from "../../utils/logger";
import { AxiosConfig } from "../primary/appConfig";
import { Clock } from "../../domain/core/ports/Clock";
import { SiretDto } from "../../shared/siret";
import { formatISO } from "date-fns";

const logger = createLogger(__filename);

export class HttpsSireneRepository implements SireneRepository {
  public static create(
    { endpoint, bearerToken }: AxiosConfig,
    clock: Clock,
  ): SireneRepository {
    if (new URL(endpoint).protocol !== "https:") {
      throw new Error(`Not an HTTPS endpoint: ${endpoint}`);
    }

    const axiosInstance = axios.create({
      baseURL: endpoint,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: "application/json",
      },
    });
    axiosInstance.interceptors.request.use((request) => {
      logger.info(request);
      return request;
    });
    axiosInstance.interceptors.response.use((response) => {
      logger.debug(response);
      return response;
    });

    return new HttpsSireneRepository(axiosInstance, clock);
  }

  private constructor(
    private readonly axiosInstance: AxiosInstance,
    private readonly clock: Clock,
  ) {}

  public async get(
    siret: SiretDto,
  ): Promise<SireneRepositoryAnswer | undefined> {
    try {
      const response = await this.axiosInstance.get("/siret", {
        params: this.createSiretQueryParams(siret),
      });
      return response.data;
    } catch (error) {
      logger.error(error);
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
