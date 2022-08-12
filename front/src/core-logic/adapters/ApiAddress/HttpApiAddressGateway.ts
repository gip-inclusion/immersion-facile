import { DepartmentCode } from "shared/src/address/address.dto";
import { ApiAddressGateway } from "src/core-logic/ports/ApiAddressGateway";
import { featuresSchemaResponse } from "shared/src/apiAdresse/apiAddress.schema";
import { AxiosInstance } from "axios";
import { AddressAndPosition } from "src/../../shared/src/apiAdresse/AddressAPI";
import { addressAndPositionListSchema } from "src/../../shared/src/address/address.schema";
import { addressRoute } from "src/../../shared/src/routes";

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

const apiAdresseSearchUrl = "https://api-adresse.data.gouv.fr/search/";

export class HttpApiAddressGateway implements ApiAddressGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  public async lookupStreetAddress(
    query: string,
  ): Promise<AddressAndPosition[]> {
    const request = {
      query,
    };
    const response = await this.httpClient.get<unknown>(`/${addressRoute}`, {
      params: request,
    });
    return addressAndPositionListSchema.parse(response.data);
  }

  public async findDepartmentCodeFromPostCode(
    query: string,
  ): Promise<DepartmentCode | null> {
    //TODO Remove catch to differentiate between http & domain errors
    try {
      const { data } = await this.httpClient.get<unknown>(apiAdresseSearchUrl, {
        params: {
          q: query,
          type: "municipality",
        },
      });

      const featuresResponce = featuresSchemaResponse.parse(data);
      const validFeatures = featuresResponce.features.filter(
        keepOnlyValidFeatures,
      );
      if (!validFeatures.length) return null;
      return getDepartmentCodeFromFeature(validFeatures[0]);
    } catch (e) {
      //eslint-disable-next-line no-console
      console.error("Api Adresse Search Error", e);
      return null;
    }
  }
}

const getDepartmentCodeFromFeature = (feature: ValidFeature) => {
  const context = feature.properties.context;
  return context.split(", ")[0];
};

const keepOnlyValidFeatures = (feature: any): feature is ValidFeature =>
  !!feature.properties &&
  !!feature.properties.label &&
  !!feature.properties.postcode &&
  !!feature.properties.context &&
  !!feature.properties.type &&
  feature?.geometry?.type === "Point" &&
  typeof feature.geometry.coordinates[1] === "number" &&
  typeof feature.geometry.coordinates[0] === "number";
