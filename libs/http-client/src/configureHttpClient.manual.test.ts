import axios from "axios";

import { createAxiosHandlerCreator } from "./adapters/createAxiosHandlerCreator";
import {
  configureHttpClient,
  createTarget,
  createTargets,
} from "./configureHttpClient";

type QueryParams = { q: string; limit: number };

const validateQueryParams = (queryParams: any) => {
  if (
    typeof queryParams?.q === "string" &&
    typeof queryParams?.limit === "number"
  )
    return queryParams as QueryParams;
  throw new Error("Missing query params");
};

type Feature = {
  type: "Feature";
  geometry: any;
  id?: string | number | undefined;
  properties: any;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

const isFeatureCollection = (data: unknown): FeatureCollection => {
  if (
    data !== null &&
    typeof data === "object" &&
    "type" in data &&
    "features" in data &&
    data.features instanceof Array &&
    data.features.every(
      (feature) =>
        feature !== null &&
        typeof feature === "object" &&
        "type" in feature &&
        "geometry" in feature &&
        "properties" in feature,
    )
  )
    return data as FeatureCollection;

  throw new Error("Wrong");
};

const targets = createTargets({
  forwardGeocoding: createTarget({
    url: "https://api-adresse.data.gouv.fr/search/",
    method: "GET",
    validateQueryParams,
    validateResponseBody: isFeatureCollection,
  }),
});

describe("Manual - Call an actual api endpoint", () => {
  const axiosHandlerCreator = createAxiosHandlerCreator(axios);
  const createHttpClient = configureHttpClient(axiosHandlerCreator);
  const httpClient = createHttpClient(targets);

  it("calls correctly the endpoint", async () => {
    const response = await httpClient.forwardGeocoding({
      queryParams: { q: "18 avenue des Canuts 69120", limit: 1 },
    });

    expect(response.status).toBe(200);
    expect(response.responseBody).toMatchObject(expectedData);
  });
});

// Faking GeoJson standard which could be found here: https://geojson.org/

const expectedData: FeatureCollection = {
  features: [
    {
      geometry: {
        coordinates: [4.923847, 45.761134],
        type: "Point",
      },
      properties: {
        city: "Vaulx-en-Velin",
        citycode: "69256",
        context: "69, Rhône, Auvergne-Rhône-Alpes",
        housenumber: "18",
        id: "69256_0227_00018",
        importance: 0.62418,
        label: "18 Avenue des Canuts 69120 Vaulx-en-Velin",
        name: "18 Avenue des Canuts",
        postcode: "69120",
        score: 0.8749254545454545,
        street: "Avenue des Canuts",
        type: "housenumber",
        x: 849523.68,
        y: 6519769.27,
      },
      type: "Feature",
    },
  ],
  type: "FeatureCollection",
};
