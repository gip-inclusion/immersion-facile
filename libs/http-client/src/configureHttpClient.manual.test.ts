import axios from "axios";
import { createAxiosHandlerCreator } from "./adapters/createAxiosHandlerCreator";
import {
  CreateTargets,
  configureHttpClient,
  Target,
} from "./configureHttpClient";

type AddressApiTargets = CreateTargets<{
  // prettier-ignore
  forwardGeocoding: Target<void, { q: string; limit: number }>;
}>;

describe("Manual - Call an actual api endpoint", () => {
  const axiosHandlerCreator = createAxiosHandlerCreator(axios);
  const createHttpClient = configureHttpClient(axiosHandlerCreator);

  const httpClient = createHttpClient<AddressApiTargets>({
    forwardGeocoding: {
      url: "https://api-adresse.data.gouv.fr/search/",
      method: "GET",
    },
  });

  it("calls correctly the endpoint", async () => {
    const response = await httpClient.forwardGeocoding({
      queryParams: { q: "18 avenue des Canuts 69120", limit: 1 },
    });

    expect(response.status).toBe(200);
    expect(response.responseBody).toMatchObject(expectedData);
  });
});

// Faking GeoJson standard which could be found here: https://geojson.org/
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

// const isFeatureCollection = (data: unknown): FeatureCollection => {
//   if (
//     data != null &&
//     typeof data === "object" &&
//     "city" in data &&
//     "citycode" in data &&
//     "context" in data &&
//     "housenumber" in data &&
//     "id" in data &&
//     "importance" in data &&
//     "label" in data &&
//     "name" in data &&
//     "postcode" in data &&
//     "score" in data &&
//     "street" in data &&
//     "type" in data &&
//     "x" in data &&
//     "y" in data
//   ) {
//     return data as FeatureCollection;
//   }
//   throw new Error("Wrong");
// };
