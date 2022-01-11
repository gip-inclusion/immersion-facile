import { secondsToMilliseconds } from "date-fns";
import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import {
  RetriableError,
  RetryStrategy,
} from "../../../domain/core/ports/RetryStrategy";
import { AdresseAPI } from "../../../domain/immersionOffer/ports/AdresseAPI";
import { LatLonDto } from "../../../shared/SearchImmersionDto";
import {
  createAxiosInstance,
  isRetriableError,
  logAxiosError,
} from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class HttpAdresseAPI implements AdresseAPI {
  public constructor(
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

  public async getPositionFromAddress(
    address: string,
  ): Promise<LatLonDto | undefined> {
    logger.debug({ address }, "getPositionFromAddress");

    return this.retryStrategy.apply(async () => {
      try {
        const axios = createAxiosInstance(logger);
        const response = await this.rateLimiter.whenReady(() =>
          axios.get("https://api-adresse.data.gouv.fr/search/", {
            timeout: secondsToMilliseconds(10),
            params: {
              q: address,
            },
          }),
        );

        if (!response.data.features || response.data.features.length == 0)
          return;

        return {
          lat: response.data.features[0].geometry.coordinates[1],
          lon: response.data.features[0].geometry.coordinates[0],
        };
      } catch (error: any) {
        if (isRetriableError(logger, error)) throw new RetriableError(error);
        logAxiosError(logger, error);
        return;
      }
    });
  }

  public async getCityCodeFromPosition(
    position: LatLonDto,
  ): Promise<number | undefined> {
    logger.debug({ position }, "getCityCodeFromPosition");
    return this.retryStrategy.apply(async () => {
      try {
        const axios = createAxiosInstance(logger);
        const response = await this.rateLimiter.whenReady(() =>
          axios.get("https://api-adresse.data.gouv.fr/reverse/", {
            timeout: secondsToMilliseconds(10),
            params: position,
          }),
        );
        return response.data.features[0]?.properties?.citycode;
      } catch (error: any) {
        if (isRetriableError(logger, error)) throw new RetriableError(error);
        logAxiosError(logger, error);
        return;
      }
    });
  }
}
