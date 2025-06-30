import { expectToEqual } from "../test.helpers";
import { decodeURIWithParams, queryParamsAsString } from "./queryParams";

describe("QueryParams utils", () => {
  describe("queryParamsAsString", () => {
    it("should return empty string when param array is empty", () => {
      const queryParams = {};

      expect(queryParamsAsString(queryParams)).toBe("");
    });

    it("should return a simple string following the pattern 'key=encodedUriValue' when param array has a single value", () => {
      const queryParams = {
        message: "I like turtles",
      };

      expect(queryParamsAsString(queryParams)).toBe(
        "message=I%20like%20turtles",
      );
    });

    it("should return a string following the pattern 'key1=encodedUriValue1&key2=encodedUriValue1' string when param array has multiple values", () => {
      const queryParams = {
        message: "I like turtles",
        teller: "John Doe",
      };

      expect(queryParamsAsString(queryParams)).toBe(
        "message=I%20like%20turtles&teller=John%20Doe",
      );
    });
  });

  describe("decodeURIWithParams", () => {
    it("should return the URL and params separated from URL 'http://www.website.fr/path/subpath/page?queryParam1=value1&queryParam2=value2'", () => {
      expectToEqual(
        decodeURIWithParams(
          "http://www.website.fr/path/subpath/page?queryParam1=value1&queryParam2=value2",
        ),
        {
          uriWithoutParams: "http://www.website.fr/path/subpath/page",
          params: {
            queryParam1: "value1",
            queryParam2: "value2",
          },
        },
      );
    });

    it("should return the URI and params separated from URI '/path/subpath/page?queryParam1=value1&queryParam2=value2'", () => {
      expectToEqual(
        decodeURIWithParams(
          "/path/subpath/page?queryParam1=value1&queryParam2=value2",
        ),
        {
          uriWithoutParams: "/path/subpath/page",
          params: {
            queryParam1: "value1",
            queryParam2: "value2",
          },
        },
      );
    });
  });
});
