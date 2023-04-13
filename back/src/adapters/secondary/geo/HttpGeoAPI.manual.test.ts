import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";

import { HttpGeoApi } from "./HttpGeoApi";

describe("HttpGeoAPI", () => {
  it("Should return a region and department by names from a postal code", async () => {
    const api = new HttpGeoApi(noRateLimit, noRetries);
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
