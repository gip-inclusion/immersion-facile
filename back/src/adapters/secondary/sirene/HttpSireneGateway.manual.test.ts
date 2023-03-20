import { SirenGateway } from "../../../domain/sirene/ports/SirenGateway";
import { AppConfig } from "../../primary/config/appConfig";

import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { HttpSirenGateway } from "./HttpSirenGateway";
import { RealTimeGateway } from "../core/TimeGateway/RealTimeGateway";

// These tests are not hermetic and not meant for automated testing. They will make requests to the
// real SIRENE API, use up production quota, and fail for uncontrollable reasons such as quota
// errors.
//
// Requires the following environment variables to be set for the tests to pass:
// - SIRENE_ENDPOINT
// - SIRENE_BEARER_TOKEN
describe("HttpSirenGateway", () => {
  let sirenGateway: SirenGateway;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    sirenGateway = new HttpSirenGateway(
      config.sirenHttpConfig,
      new RealTimeGateway(),
      noRateLimit,
      noRetries,
    );
  });

  it("returns open establishments", async () => {
    // ETABLISSEMENT PUBLIC DU MUSEE DU LOUVRE (should be active)
    const response = await sirenGateway.getEstablishmentBySiret(
      "18004623700012",
    );
    expect(response?.etablissements).toHaveLength(1);
  });

  it("filters out closed establishments", async () => {
    // SOCIETE TEXTILE D'HENIN LIETARD, closed in 1966.
    const response = await sirenGateway.getEstablishmentBySiret(
      "38961161700017",
    );
    expect(response).toBeUndefined();
  });
});
