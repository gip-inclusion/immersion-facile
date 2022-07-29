import { AxiosResponse } from "axios";
import { secondsToMilliseconds } from "date-fns";
import { AddressDto } from "shared/src/address/address.dto";
import { LatLonDto } from "shared/src/latLon";
import {
  ManagedAxios,
  TargetUrlsMapper,
} from "shared/src/serenity-http-client";
import { sleep } from "shared/src/utils";
import { RateLimiter } from "../../../domain/core/ports/RateLimiter";
import {
  RetryableError,
  RetryStrategy,
} from "../../../domain/core/ports/RetryStrategy";
import { AddressAPI } from "../../../domain/immersionOffer/ports/AddressAPI";
import {
  createAxiosInstance,
  isRetryableError,
  logAxiosError,
} from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import { RealClock } from "../core/ClockImplementations";
import { QpsRateLimiter } from "../core/QpsRateLimiter";
import { toFeatureCollection } from "shared/src/apiAdresse/apiAddress.schema";
import { featureToAddressDto } from "shared/src/apiAdresse/apiAddress.dto";

const logger = createLogger(__filename);

// https://api.gouv.fr/les-api/base-adresse-nationale
const apiAddressMaxQueryPerSeconds = 30;

export const apiAddressRateLimiter = (clock: RealClock) =>
  new QpsRateLimiter(
    Math.round(apiAddressMaxQueryPerSeconds * 0.9),
    clock,
    sleep,
  );

export const apiAddressBaseUrl = `https://api-adresse.data.gouv.fr`;
export const apiRoutes = {
  search: `/search`,
  reverse: `/reverse`,
};
export const targetUrlsMapper: TargetUrlsMapper<TargetUrl> = {
  apiAddressReverse: (param: { lat: string; lon: string }) =>
    `${apiAddressBaseUrl}${apiRoutes.reverse}?lon=${param.lon}&lat=${param.lat}`,
};

const onFulfilledResponseInterceptorMaker: () => (
  response: AxiosResponse,
) => AxiosResponse = () => (response) => response;

export const httpAddressApiClient = new ManagedAxios(
  targetUrlsMapper,
  undefined,
  undefined,
  onFulfilledResponseInterceptorMaker,
  undefined,
);

type TargetUrl = "apiAddressReverse";

export class HttpAddressAPI implements AddressAPI {
  public constructor(
    private readonly httpClient: ManagedAxios<TargetUrl>,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

  public async getAddressFromPosition(
    latLongDto: LatLonDto,
  ): Promise<AddressDto | undefined> {
    logger.debug({ latLongDto }, "getAddressFromPosition");
    return this.retryStrategy.apply(async () => {
      try {
        const response = await this.rateLimiter.whenReady(() =>
          this.httpClient.get({
            target: this.httpClient.targetsUrls.apiAddressReverse,
            targetParams: latLongDto,
          }),
        );
        const features = toFeatureCollection(response.data).features;
        return features.length > 0
          ? featureToAddressDto(features[0])
          : undefined;
      } catch (error: any) {
        if (isRetryableError(logger, error)) throw new RetryableError(error);
        logAxiosError(logger, error);
        return undefined;
      }
    });
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
