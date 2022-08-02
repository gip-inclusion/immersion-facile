import { AxiosResponse } from "axios";
import { secondsToMilliseconds } from "date-fns";
import { AddressDto } from "shared/src/address/address.dto";
import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";
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
import {
  AddressAPI,
  AddressAndPosition as AddressAndPosition,
} from "../../../domain/immersionOffer/ports/AddressAPI";
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
    latLongDto: GeoPositionDto,
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

  public async getAddressAndPositionFromString(
    address: string,
  ): Promise<AddressAndPosition | undefined> {
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
        const feature = response.data.features[0];
        return featureToAddressAndPosition(feature);
      } catch (error: any) {
        if (isRetryableError(logger, error)) throw new RetryableError(error);
        logAxiosError(logger, error);
        return;
      }
    });
  }

  public async getCityCodeFromPosition(
    position: GeoPositionDto,
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

type ValidFeature = {
  properties: {
    type: string;
    label: string;
    name: string;
    city: string;
    postcode: string;
    context: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

const featureToAddressAndPosition = (
  feature: ValidFeature,
): AddressAndPosition | undefined => {
  const position: GeoPositionDto = {
    lat: feature.geometry.coordinates[1],
    lon: feature.geometry.coordinates[0],
  };
  const address: AddressDto = {
    streetNumberAndAddress: feature.properties.name,
    postcode: feature.properties.postcode,
    city: feature.properties.city,
    departmentCode: getDepartmentCodeFromFeature(feature),
  };
  return { address, position };
};

const getDepartmentCodeFromFeature = (feature: ValidFeature) => {
  const context = feature.properties.context;
  return context.split(", ")[0];
};
