import { ConnectionRefusedError } from "./adapters";
import { HttpClientForbiddenError } from "./errors";
import { ErrorMapper } from "./httpClient";
import { toMappedErrorMaker } from "./httpClient.mappers";

describe("toMappedErrorMaker", () => {
  it("toErrorMapper should return input if mappedErrors are undefined", () => {
    type TargetUrls = "ADDRESS_API_SEARCH_ENDPOINT";
    const error = new HttpClientForbiddenError("Plop", new Error("plip"));

    const errorMapper = toMappedErrorMaker(
      "ADDRESS_API_SEARCH_ENDPOINT",
      undefined as unknown as ErrorMapper<TargetUrls>,
    );

    expect(errorMapper(error)).toBe(error);
  });

  it("toErrorMapper should return input if the error is not in mapped errors", () => {
    type TargetUrls = "ADDRESS_API_SEARCH_ENDPOINT";
    const error = new HttpClientForbiddenError("Plop", new Error("plip"));

    const errorMapper: ErrorMapper<TargetUrls> = {
      ADDRESS_API_SEARCH_ENDPOINT: {
        HttpBadRequestError: () =>
          new Error("I identify as a Bad Request Error"),
      },
    };

    const toMappedError = toMappedErrorMaker(
      "ADDRESS_API_SEARCH_ENDPOINT",
      errorMapper,
    );

    expect(toMappedError(error)).toBe(error);
  });

  it("toErrorMapper should return mapped http error", () => {
    type TargetUrls = "ADDRESS_API_SEARCH_ENDPOINT";
    const error = new HttpClientForbiddenError("Plop", new Error("plip"));

    const expectedError = new Error(
      "you though it was HttpClientForbiddenError but it was me, Dio !",
    );

    const errorMapper: ErrorMapper<TargetUrls> = {
      ADDRESS_API_SEARCH_ENDPOINT: {
        HttpClientForbiddenError: () => expectedError,
      },
    };

    const toMappedError = toMappedErrorMaker(
      "ADDRESS_API_SEARCH_ENDPOINT",
      errorMapper,
    );

    expect(toMappedError(error)).toBe(expectedError);
  });

  it("toErrorMapper should return mapped ConnectionRefusedError", () => {
    type TargetUrls = "ADDRESS_API_SEARCH_ENDPOINT";
    const error = new ConnectionRefusedError(
      "Could not connect to server because there is no server !",
      new Error("I caused this"),
    );

    const expectedError = new Error(
      "you though it was ConnectionRefusedError but it was me, Dio !",
    );

    const errorMapper: ErrorMapper<TargetUrls> = {
      ADDRESS_API_SEARCH_ENDPOINT: {
        ConnectionRefusedError: () => expectedError,
      },
    };

    const toMappedError = toMappedErrorMaker(
      "ADDRESS_API_SEARCH_ENDPOINT",
      errorMapper,
    );

    expect(toMappedError(error)).toBe(expectedError);
  });
});
