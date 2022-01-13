import axios from "axios";
import { LatLonDto } from "src/shared/SearchImmersionDto";
import {
  AddressWithCoordinates,
  ApiAdresseGateway,
} from "../ports/ApiAdresseGateway";

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

export class HttpApiAdresseGateway implements ApiAdresseGateway {
  public async lookupStreetAddress(
    query: string,
  ): Promise<AddressWithCoordinates[]> {
    try {
      const response = await axios.get(
        "https://api-adresse.data.gouv.fr/search/",
        {
          params: {
            q: query,
          },
        },
      );

      return (response.data.features as unknown[])
        .filter(keepOnlyValidFeatures)
        .map(featureToStreetAddressWithCoordinates)
        .filter(removeNilValues);
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  public async lookupPostCode(query: string): Promise<LatLonDto | null> {
    try {
      const response = await axios.get(
        "https://api-adresse.data.gouv.fr/search/",
        {
          params: {
            q: query,
            type: "municipality",
          },
        },
      );

      const validFeatures = (response.data.features as unknown[]).filter(
        keepOnlyValidFeatures,
      );
      if (validFeatures.length > 0) {
        const feature = validFeatures[0];
        return {
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
        };
      } else {
        return null;
      }
    } catch (e) {
      console.error(e);
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
  if (!label) return;

  return {
    coordinates: {
      lat: feature.geometry.coordinates[1],
      lon: feature.geometry.coordinates[0],
    },
    label,
  };
};

const buildLabel = (feature: {
  properties: { [k: string]: string };
}): string | undefined => {
  if (feature.properties.label.includes(feature.properties.postcode))
    return feature.properties.label;

  if (feature.properties.type === "municipality")
    return [feature.properties.postcode, feature.properties.name].join(" ");

  console.error("Unexpected API adresse feature", feature);
  return;
};
