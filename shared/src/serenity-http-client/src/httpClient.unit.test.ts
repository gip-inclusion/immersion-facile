import {
  AbsoluteUrl,
  getTargetFromPredicate,
  isHttpClientError,
  isHttpServerError,
  TargetUrlsMapper,
} from "./httpClient";

describe("Http Client Errors", () => {
  it.each([
    [100, false],
    [308, false],
    [399, false],
    [400, true],
    [451, true],
    [499, true],
    [500, false],
    [502, false],
  ])(
    "isHttpClientErrorStatus should detect CreateHttpClient 4XX errors, expect: (%i to be %s)",
    (httpStatusCode: number, expected: boolean) => {
      expect(isHttpClientError(httpStatusCode)).toBe(expected);
    },
  );
});

describe("Http Server Errors", () => {
  it.each([
    [100, false],
    [308, false],
    [399, false],
    [400, false],
    [451, false],
    [499, false],
    [500, true],
    [502, true],
    [511, true],
    [600, false],
  ])(
    "isHttpServerErrorStatus should detect Http Server 5XX errors, expect: (%i to be %s)",
    (httpStatusCode: number, expected: boolean) => {
      expect(isHttpServerError(httpStatusCode)).toBe(expected);
    },
  );
});

describe("find target from callback", () => {
  it("getTargetFromPredicate should return", () => {
    type TargetUrls = "ADDRESS_API_SEARCH" | "ADDRESS_API_GEOLOCATE";

    const targetToValidSearchUrl = (rawQueryString: string): AbsoluteUrl =>
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURI(
        rawQueryString,
      )}&limit=1`;

    const targetToGeolocateUrl = (): AbsoluteUrl =>
      `https://geo.api.gouv.fr/communes`;

    const targetUrls: TargetUrlsMapper<TargetUrls> = {
      ADDRESS_API_SEARCH: targetToValidSearchUrl,
      ADDRESS_API_GEOLOCATE: targetToGeolocateUrl,
    };

    expect(getTargetFromPredicate(targetToValidSearchUrl, targetUrls)).toBe(
      "ADDRESS_API_SEARCH",
    );

    expect(getTargetFromPredicate(targetToGeolocateUrl, targetUrls)).toBe(
      "ADDRESS_API_GEOLOCATE",
    );
  });
});
