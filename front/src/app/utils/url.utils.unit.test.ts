import {
  filterParamsForRoute,
  getUrlParameters,
} from "src/app/utils/url.utils";

describe("url.utils", () => {
  describe("getUrlParameters", () => {
    it("should return an object with the parameters", () => {
      const location = {
        search: "?param1=value1&param2=value2",
      } as Location;
      const result = getUrlParameters(location);
      expect(result).toEqual({
        param1: "value1",
        param2: "value2",
      });
    });
  });
  describe("filteredUrlParamsForRoute", () => {
    it("should return an object with the parameters", () => {
      const urlParams = {
        param1: "value1",
        param2: "value2",
      };
      const matchingParams = {
        param1: "value1",
      };

      const result = filterParamsForRoute(urlParams, matchingParams);
      expect(result).toEqual({
        param1: "value1",
      });
    });
  });
});
