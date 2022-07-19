import { secondsToMilliseconds } from "date-fns";
import { AddressDto } from "shared/src/address/address.dto";
import { LatLonDto } from "shared/src/latLon";
import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import {
  RetryableError,
  RetryStrategy,
} from "../../../domain/core/ports/RetryStrategy";
import { AdresseAPI } from "../../../domain/immersionOffer/ports/AdresseAPI";
import {
  createAxiosInstance,
  isRetryableError,
  logAxiosError,
} from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class HttpAdresseAPI implements AdresseAPI {
  public constructor(
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

  public async getAddressFromPosition({
    lat,
    lon,
  }: LatLonDto): Promise<AddressDto | undefined> {
    return this.retryStrategy.apply(
      async (): Promise<AddressDto | undefined> => {
        try {
          const axios = createAxiosInstance(logger);
          const response = await this.rateLimiter.whenReady(() =>
            axios.get("https://api-adresse.data.gouv.fr/reverse/", {
              timeout: secondsToMilliseconds(10),
              params: {
                lat,
                lon,
              },
            }),
          );

          if (!response.data.features || response.data.features.length == 0)
            return;

          const feature = response.data.features[0];

          return {
            streetNumberAndAddress: feature.properties.name,
            city: feature.properties.city,
            countyCode: feature.properties.context.split(", ")[0],
            postCode: feature.properties.postcode,
          };
        } catch (error: any) {
          if (isRetryableError(logger, error)) throw new RetryableError(error);
          logAxiosError(logger, error);
          return;
        }
      },
    );
  }

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
        if (isRetryableError(logger, error)) throw new RetryableError(error);
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
        if (isRetryableError(logger, error)) throw new RetryableError(error);
        logAxiosError(logger, error);
        return;
      }
    });
  }
}
