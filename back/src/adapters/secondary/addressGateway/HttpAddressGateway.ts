import Bottleneck from "bottleneck";
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
  HttpServerError,
  ManagedAxios,
  TargetUrlsMapper,
} from "shared/src/serenity-http-client";
import { AddressGateway } from "../../../domain/immersionOffer/ports/AddressGateway";
import { logAxiosError } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

// https://api.gouv.fr/les-api/base-adresse-nationale
const apiAddressBaseUrl = `https://api-adresse.data.gouv.fr`;
const apiAddressMaxQueryPerSeconds = 30;
const apiRoutes = {
  search: `/search`,
  reverse: `/reverse`,
};
type TargetUrls =
  | "apiAddressReverse"
  | "apiAddressSearchMunicipalityPlainText"
  | "apiAddressSearchPlainText";

const targetUrlsReverseMapper: TargetUrlsMapper<TargetUrls> = {
  apiAddressReverse: (param: { lat: string; lon: string }) =>
    `${apiAddressBaseUrl}${apiRoutes.reverse}?lon=${param.lon}&lat=${param.lat}`,
  apiAddressSearchMunicipalityPlainText: (param: { text: string }) =>
    `${apiAddressBaseUrl}${apiRoutes.search}?q=${param.text}&type=municipality`,
  apiAddressSearchPlainText: (param: { text: string }) =>
    `${apiAddressBaseUrl}${apiRoutes.search}?q=${param.text}`,
};

export const httpAddressApiClient = new ManagedAxios(
  targetUrlsReverseMapper,
  undefined,
  {
    timeout: 10000,
  },
);

export class HttpAddressGateway implements AddressGateway {
  public constructor(private readonly httpClient: ManagedAxios<TargetUrls>) {}

  public async lookupStreetAddress(
    query: string,
  ): Promise<AddressAndPosition[]> {
    try {
      const { data } = await this.limiter.schedule(() =>
        this.httpClient.get({
          target:
            this.httpClient.targetsUrls.apiAddressSearchMunicipalityPlainText,
          targetParams: {
            text: query,
          },
        }),
      );
      return toFeatureCollection(data)
        .features.map(featureToAddressWithPosition)
        .filter((feature): feature is AddressAndPosition => !!feature);
    } catch (error) {
      if (error instanceof HttpServerError && error.httpStatusCode === 503)
        return this.lookupStreetAddress(query);
      logger.error("Api Adresse lookupStreetAddress", error);
      throw error;
    }
  }

  async findDepartmentCodeFromPostCode(
    query: string,
  ): Promise<DepartmentCode | null> {
    try {
      const { data } = await this.limiter.schedule(() =>
        this.httpClient.get({
          target:
            this.httpClient.targetsUrls.apiAddressSearchMunicipalityPlainText,
          targetParams: {
            text: query,
          },
        }),
      );
      const features = toFeatureCollection(data).features;
      return features.length
        ? featureToAddressDto(features[0]).departmentCode
        : null;
    } catch (error) {
      if (error instanceof HttpServerError && error.httpStatusCode === 503)
        return this.findDepartmentCodeFromPostCode(query);
      logger.error("Api Adresse Search Error", error);
      return null;
    }
  }

  public async getAddressFromPosition(
    latLongDto: GeoPositionDto,
  ): Promise<AddressDto | undefined> {
    logger.debug({ latLongDto }, "getAddressFromPosition");
    try {
      const { data } = await this.limiter.schedule(() =>
        this.httpClient.get({
          target: this.httpClient.targetsUrls.apiAddressReverse,
          targetParams: latLongDto,
        }),
      );
      const features = toFeatureCollection(data).features;
      return features.length > 0 ? featureToAddressDto(features[0]) : undefined;
    } catch (error: any) {
      if (error instanceof HttpServerError && error.httpStatusCode === 503)
        return this.getAddressFromPosition(latLongDto);
      logger.error({ error, latLongDto }, "getAddressFromPosition");
      throw error;
    }
  }

  public async getAddressAndPositionFromString(
    address: string,
  ): Promise<AddressAndPosition | undefined> {
    logger.debug({ address }, "getPositionFromAddress");
    try {
      const { data } = await this.limiter.schedule(() =>
        this.httpClient.get({
          target: this.httpClient.targetsUrls.apiAddressSearchPlainText,
          targetParams: {
            text: address,
          },
        }),
      );
      const features = toFeatureCollection(data).features;
      if (features.length === 0) return;
      return featureToAddressWithPosition(features[0]);
    } catch (error: any) {
      if (error instanceof HttpServerError && error.httpStatusCode === 503)
        return this.getAddressAndPositionFromString(address);
      logAxiosError(logger, error);
      return;
    }
  }

  private limiter = new Bottleneck({
    reservoir: apiAddressMaxQueryPerSeconds,
    reservoirIncreaseInterval: 1000,
    reservoirIncreaseAmount: apiAddressMaxQueryPerSeconds,
  });
}

const featureToAddressWithPosition = (
  feature: GeoJsonFeature,
): AddressAndPosition | undefined =>
  Array.isArray(feature.geometry.coordinates)
    ? {
        address: featureToAddressDto(feature),
        position: {
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
        },
      }
    : undefined;
