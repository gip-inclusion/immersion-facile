import axios, { AxiosInstance } from "axios";
import { SireneRepository } from "../../domain/sirene/ports/SireneRepository";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export class HttpsSireneRepository implements SireneRepository {
  private readonly axiosInstance: AxiosInstance;

  public static create(
    sireneEndpoint: string,
    bearerToken: string,
  ): SireneRepository {
    if (new URL(sireneEndpoint).protocol !== "https:") {
      throw new Error(`Not an HTTPS endpoint: ${sireneEndpoint}`);
    }

    const axiosInstance = axios.create({
      baseURL: sireneEndpoint,
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

  public async get(siret: String): Promise<Object | undefined> {
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
