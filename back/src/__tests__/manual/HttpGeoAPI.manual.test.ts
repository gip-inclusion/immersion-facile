import { noRateLimit } from "../../domain/core/ports/RateLimiter";
import { noRetries } from "../../domain/core/ports/RetryStrategy";
import { HttpGeoAPI } from "../../adapters/secondary/HttpGeoAPI";

describe("HttpGeoAPI", () => {
  it("Should return a region and department by names from a postal code", async () => {
    const api = new HttpGeoAPI(noRateLimit, noRetries);
    const codePostal = "02000";
    const regionAndDepartment = await api.getRegionAndDepartmentFromCodePostal(
      codePostal,
    );

    const expectedRegionAndDepatment = {
      region: "Hauts-de-France",
      department: "Aisne",
    };

    expect(regionAndDepartment).toStrictEqual(expectedRegionAndDepatment);
  });
});
