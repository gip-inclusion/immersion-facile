import { AxiosError } from "axios";
import { secondsToMilliseconds } from "date-fns";
import {
  AddressAndPosition,
  AddressDto,
  DepartmentCode,
} from "shared/src/address/address.dto";
import {
  featureToAddressDto,
  GeoJsonFeature,
} from "shared/src/apiAdresse/apiAddress.dto";
import { toFeatureCollection } from "shared/src/apiAdresse/apiAddress.schema";
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
import { AddressGateway } from "../../../domain/immersionOffer/ports/AddressGateway";
import {
  createAxiosInstance,
  isRetryableError,
  logAxiosError,
} from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import { RealClock } from "../core/ClockImplementations";
import { QpsRateLimiter } from "../core/QpsRateLimiter";

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
type TargetUrls = "apiAddressReverse" | "apiAddressSearchPlainText";

export const targetUrlsReverseMapper: TargetUrlsMapper<TargetUrls> = {
  apiAddressReverse: (param: { lat: string; lon: string }) =>
    `${apiAddressBaseUrl}${apiRoutes.reverse}?lon=${param.lon}&lat=${param.lat}`,
  apiAddressSearchPlainText: (param: { text: string }) =>
    `${apiAddressBaseUrl}${apiRoutes.search}?q=${param.text}&type=municipality`,
};

export const httpAddressApiClient = new ManagedAxios(targetUrlsReverseMapper);

export class HttpAddressGateway implements AddressGateway {
  public constructor(
    private readonly httpClient: ManagedAxios<TargetUrls>,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

  public async lookupStreetAddress(
    query: string,
  ): Promise<AddressAndPosition[]> {
    const { data } = await this.httpClient.get({
      target: this.httpClient.targetsUrls.apiAddressSearchPlainText,
      targetParams: {
        text: query,
      },
    });
    return toFeatureCollection(data)
      .features.map(featureToAddressWithPosition)
      .filter((feature): feature is AddressAndPosition => !!feature);
  }
  async findDepartmentCodeFromPostCode(
    query: string,
  ): Promise<DepartmentCode | null> {
    //TODO Remove catch to differentiate between http & domain errors
    try {
      const { data } = await this.httpClient.get({
        target: this.httpClient.targetsUrls.apiAddressSearchPlainText,
        targetParams: {
          text: query,
        },
      });
      const features = toFeatureCollection(data).features;
      return features.length
        ? featureToAddressDto(features[0]).departmentCode
        : null;
    } catch (error) {
      logger.error("Api Adresse Search Error", error);
      return null;
    }
  }

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
        if (isAxiosError(error)) return;
        logger.error({ error, latLongDto }, "getAddressFromPosition");
        throw error;
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
        const { data } = await this.rateLimiter.whenReady(() =>
          axios.get<unknown>("https://api-adresse.data.gouv.fr/search/", {
            timeout: secondsToMilliseconds(10),
            params: {
              q: address,
            },
          }),
        );
        const features = toFeatureCollection(data).features;
        if (features.length === 0) return;
        return featureToAddressWithPosition(features[0]);
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

const featureToAddressWithPosition = (
  feature: GeoJsonFeature,
): AddressAndPosition | undefined => {
  const address = featureToAddressDto(feature);
  return Array.isArray(feature.geometry.coordinates)
    ? {
        address,
        position: {
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
        },
      }
    : undefined;
};

const isAxiosError = <T>(
  error: Error | AxiosError<T>,
): error is AxiosError<T> => "isAxiosError" in error && error.isAxiosError;
