import axios from "axios";

import {
  AddressWithCoordinates,
  ApiAdresseGateway,
} from "src/core-logic/ports/ApiAdresseGateway";
import { LatLonDto } from "shared/src/latLon";
import { validateDataFromSchema } from "shared/src/zodUtils";
import { featuresSchemaResponse } from "shared/src/apiAdresse/apiAddress.schema";

type ValidFeature = {
  properties: {
    type: string;
    label: string;
    postcode: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

const apiAdresseSearchUrl = "https://api-adresse.data.gouv.fr/search/";

export class HttpApiAdresseGateway implements ApiAdresseGateway {
  public async lookupStreetAddress(
    query: string,
  ): Promise<AddressWithCoordinates[]> {
    try {
      const { data } = await axios.get<unknown>(apiAdresseSearchUrl, {
        params: {
          q: query,
          limit: 10,
        },
      });
      const featuresResponce = validateDataFromSchema(
        featuresSchemaResponse,
        data,
      );
      if (featuresResponce instanceof Error) throw featuresResponce;
      return featuresResponce.features
        .filter(keepOnlyValidFeatures)
        .map(featureToStreetAddressWithCoordinates)
        .filter(removeNilValues);
    } catch (e) {
      //eslint-disable-next-line no-console
      console.error("Api Adresse Search Error", e);
      return [];
    }
  }

  public async lookupPostCode(query: string): Promise<LatLonDto | null> {
    try {
      const { data } = await axios.get<unknown>(apiAdresseSearchUrl, {
        params: {
          q: query,
          type: "municipality",
        },
      });

      const featuresResponce = validateDataFromSchema(
        featuresSchemaResponse,
        data,
      );
      if (featuresResponce instanceof Error) throw featuresResponce;
      const validFeatures = featuresResponce.features.filter(
        keepOnlyValidFeatures,
      );
      return validFeatures.length > 0
        ? {
            lat: validFeatures[0].geometry.coordinates[1],
            lon: validFeatures[0].geometry.coordinates[0],
          }
        : null;
    } catch (e) {
      //eslint-disable-next-line no-console
      console.error("Api Adresse Search Error", e);
      return null;
    }
  }
}

const removeNilValues = (
  address: AddressWithCoordinates | undefined,
): address is AddressWithCoordinates => !!address;

const keepOnlyValidFeatures = (feature: any): feature is ValidFeature =>
  !!feature.properties &&
  !!feature.properties.label &&
  !!feature.properties.postcode &&
  !!feature.properties.type &&
  feature?.geometry?.type === "Point" &&
  typeof feature.geometry.coordinates[1] === "number" &&
  typeof feature.geometry.coordinates[0] === "number";

const featureToStreetAddressWithCoordinates = (
  feature: ValidFeature,
): AddressWithCoordinates | undefined => {
  const label = buildLabel(feature);
  return label
    ? {
        coordinates: {
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
        },
        label,
      }
    : undefined;
};

const buildLabel = (feature: {
  properties: { [k: string]: string };
}): string | undefined => {
  if (feature.properties.label.includes(feature.properties.postcode))
    return feature.properties.label;

  if (feature.properties.type === "municipality")
    return [feature.properties.postcode, feature.properties.name].join(" ");
  //eslint-disable-next-line no-console
  console.error("Unexpected API adresse feature", feature);
  return;
};
