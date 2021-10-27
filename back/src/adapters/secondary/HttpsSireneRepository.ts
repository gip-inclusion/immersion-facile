import axios, { AxiosInstance } from "axios";
import {
  SireneRepository,
  SiretResponse,
} from "../../domain/sirene/ports/SireneRepository";
import { SiretDto } from "../../shared/siret";
import { createLogger } from "../../utils/logger";
import { AxiosConfig } from "../primary/appConfig";

const logger = createLogger(__filename);

export class HttpsSireneRepository implements SireneRepository {
  private readonly axiosInstance: AxiosInstance;

  public static create({
    endpoint,
    bearerToken,
  }: AxiosConfig): SireneRepository {
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

    return new HttpsSireneRepository(axiosInstance);
  }

  private constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  public async get(siret: SiretDto): Promise<SiretResponse | undefined> {
    try {
      const response = await this.axiosInstance.get("/siret", {
        params: { q: `siret:${siret}` },
      });
      return response.data;
    } catch (error: any) {
      logger.error(error);
      if (error.response.status == 404) {
        return undefined;
      }
      throw error;
    }
  }
}
