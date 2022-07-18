import { ManagedAxios } from "./axios.adapter";

import {
  ErrorMapper,
  HttpClient,
  HttpResponse,
  TargetUrlsMapper,
} from "../httpClient";
import { AbsoluteUrl } from "../../AbsoluteUrl";
import { HttpClientError } from "../errors/HttpClientError.error";

describe("httpClient with axios concrete adapter", () => {
  const targetToValidSearchUrl = (rawQueryString: string): AbsoluteUrl =>
    `https://api-adresse.data.gouv.fr/search/?q=${encodeURI(
      rawQueryString,
    )}&limit=1`;

  it("expect user defined function to produce absolute url", () => {
    expect(targetToValidSearchUrl("18 avenue des Canuts 69120")).toBe(
      `https://api-adresse.data.gouv.fr/search/?q=18%20avenue%20des%20Canuts%2069120&limit=1`,
    );
  });

  it("should call API Adresse and return 200 with data", async () => {
    type TargetUrls = "ADRESS_API_ENDPOINT";
    const targetUrls: TargetUrlsMapper<TargetUrls> = {
      ADRESS_API_ENDPOINT: targetToValidSearchUrl,
    };

    const httpClient: HttpClient = new ManagedAxios(targetUrls);

    const response: HttpResponse = await httpClient.get({
      target: targetUrls.ADRESS_API_ENDPOINT,
      targetParams: "18 avenue des Canuts 69120",
    });

    const expectedStatus = 200;
    const expectedData = {
      attribution: "BAN",
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
      licence: "ETALAB-2.0",
      limit: 1,
      query: "18 avenue des Canuts 69120",
      type: "FeatureCollection",
      version: "draft",
    };

    expect(response.status).toBe(expectedStatus);
    expect(response.data).toStrictEqual(expectedData);
  });

  it("should call API Adresse with invalid address and throw HttpClientError", async () => {
    type TargetUrls = "ADDRESS_API_SEARCH_ENDPOINT";

    const targetToInvalidSearchUrl = (rawQueryString: string): AbsoluteUrl =>
      `https://api-adresse.data.gouv.fr/search/?d=${rawQueryString}&limit=1`;

    const targetUrls: TargetUrlsMapper<TargetUrls> = {
      ADDRESS_API_SEARCH_ENDPOINT: targetToInvalidSearchUrl,
    };

    const httpClient: HttpClient = new ManagedAxios(targetUrls);

    const responsePromise: Promise<HttpResponse> = httpClient.get({
      target: targetUrls.ADDRESS_API_SEARCH_ENDPOINT,
      targetParams: "18 avenue des Canuts 69120",
    });

    await expect(responsePromise).rejects.toThrow(HttpClientError);
  });

  it("should call API Adresse with invalid address and throw remapped CustomError", async () => {
    class CustomError extends Error {
      constructor(message: string, cause?: Error) {
        super(message, { cause });
      }
    }

    type TargetUrls = "ADDRESS_API_SEARCH_ENDPOINT";

    const targetToInvalidSearchUrl = (rawQueryString: string): AbsoluteUrl =>
      `https://api-adresse.data.gouv.fr/search/?d=${rawQueryString}&limit=1`;

    const targetUrls: TargetUrlsMapper<TargetUrls> = {
      ADDRESS_API_SEARCH_ENDPOINT: targetToInvalidSearchUrl,
    };

    const targetsErrorResponseOverrideMapper: ErrorMapper<TargetUrls> = {
      ADDRESS_API_SEARCH_ENDPOINT: {
        HttpClientError: (error) =>
          new CustomError("You have an invalid url you dummy dum dum !", error),
        HttpServerError: (error) =>
          new Error(
            "You have an invalid url HttpServerError you dummy dum dum !",
            error,
          ),
      },
    };

    const httpClient: HttpClient = new ManagedAxios(
      targetUrls,
      targetsErrorResponseOverrideMapper,
    );

    const responsePromise: Promise<HttpResponse> = httpClient.get({
      target: targetUrls.ADDRESS_API_SEARCH_ENDPOINT,
      targetParams: "18 avenue des Canuts 69120",
    });

    await expect(responsePromise).rejects.toThrow(CustomError);
  });
});
