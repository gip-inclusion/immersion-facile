import { AppConfig } from "../../adapters/primary/config/appConfig";
import { RealClock } from "../../adapters/secondary/core/ClockImplementations";
import { HttpsSireneGateway } from "../../adapters/secondary/HttpsSireneGateway";
import { noRateLimit } from "../../domain/core/ports/RateLimiter";
import { noRetries } from "../../domain/core/ports/RetryStrategy";
import { SireneGateway } from "../../domain/sirene/ports/SireneGateway";

// These tests are not hermetic and not meant for automated testing. They will make requests to the
// real SIRENE API, use up production quota, and fail for uncontrollable reasons such as quota
// errors.
//
// Requires the following environment variables to be set for the tests to pass:
// - SIRENE_ENDPOINT
// - SIRENE_BEARER_TOKEN
describe("HttpsSireneGateway", () => {
  let sireneGateway: SireneGateway;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    sireneGateway = new HttpsSireneGateway(
      config.sireneHttpsConfig,
      new RealClock(),
      noRateLimit,
      noRetries,
    );
  });

  it("returns open establishments", async () => {
    // ETABLISSEMENT PUBLIC DU MUSEE DU LOUVRE (should be active)
    const response = await sireneGateway.get("18004623700012");
    expect(response?.etablissements).toHaveLength(1);
  });

  it("filters out closed establishments", async () => {
    // SOCIETE TEXTILE D'HENIN LIETARD, closed in 1966.
    const response = await sireneGateway.get("38961161700017");
    expect(response).toBeUndefined();
  });
});
