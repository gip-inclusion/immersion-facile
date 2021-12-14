import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import { Position } from "../../../domain/immersionOffer/ports/GetPosition";
import { createAxiosInstance, logAxiosError } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class APIAdresseGateway {
  public constructor(private readonly rateLimiter: RateLimiter) {}

  async getGPSFromAddressAPIAdresse(address: string): Promise<Position> {
    logger.debug({ address }, "getGPSFromAddressAPIAdresse");

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
      return { lat: -1, lon: -1 };
    }
  }

  /*
    Returns city code from latitude and longitude parameters using the api-adresse API from data.gouv
    Returns -1 if did not find
  */
  async getCityCodeFromLatLongAPIAdresse(
    lat: number,
    lon: number,
  ): Promise<number> {
    logger.debug({ lat, lon }, "getCityCodeFromLatLongAPIAdresse");
    try {
      const axios = createAxiosInstance(logger);
      const response = await this.rateLimiter.whenReady(() =>
        axios.get("https://api-adresse.data.gouv.fr/reverse/", {
          params: { lon, lat },
        }),
      );
      if (response.data.features.length != 0)
        return response.data.features[0].properties.citycode;
      return -1;
    } catch (error: any) {
      logAxiosError(logger, error);
      return -1;
    }
  }
}
