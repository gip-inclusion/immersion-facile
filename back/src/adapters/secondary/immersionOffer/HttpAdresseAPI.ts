import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import {
  AdresseAPI,
  Position,
} from "../../../domain/immersionOffer/ports/AdresseAPI";
import { createAxiosInstance, logAxiosError } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class HttpAdresseAPI implements AdresseAPI {
  public constructor(private readonly rateLimiter: RateLimiter) {}

  public async getPositionFromAddress(
    address: string,
  ): Promise<Position | undefined> {
    logger.debug({ address }, "getPositionFromAddress");

    try {
      const axios = createAxiosInstance(logger);
      const response = await this.rateLimiter.whenReady(() =>
        axios.get("https://api-adresse.data.gouv.fr/search/", {
          params: {
            q: address,
          },
        }),
      );
      return {
        lat: response.data.features[0].geometry.coordinates[1],
        lon: response.data.features[0].geometry.coordinates[0],
      };
    } catch (error: any) {
      logAxiosError(logger, error);
      return;
    }
  }

  public async getCityCodeFromPosition(
    position: Position,
  ): Promise<number | undefined> {
    logger.debug({ position }, "getCityCodeFromPosition");
    try {
      const axios = createAxiosInstance(logger);
      const response = await this.rateLimiter.whenReady(() =>
        axios.get("https://api-adresse.data.gouv.fr/reverse/", {
          params: position,
        }),
      );
      return response.data.features[0]?.properties?.citycode;
    } catch (error: any) {
      logAxiosError(logger, error);
      return;
    }
  }
}
