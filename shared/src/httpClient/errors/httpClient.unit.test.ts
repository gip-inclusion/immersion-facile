import { isHttpClientError, isHttpServerError } from "../httpClient";

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
    "isHttpClientErrorStatus should detect HttpClient 4XX errors, expect: (%i to be %s)",
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
