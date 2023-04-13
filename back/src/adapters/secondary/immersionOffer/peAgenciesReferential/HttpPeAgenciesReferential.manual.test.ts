import { noRateLimit } from "../../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../../domain/core/ports/RetryStrategy";
import { AppConfig } from "../../../primary/config/appConfig";
import { PoleEmploiAccessTokenGateway } from "../PoleEmploiAccessTokenGateway";

import { HttpPeAgenciesReferential } from "./HttpPeAgenciesReferential";

const config = AppConfig.createFromEnv();
const accessTokenGateway = new PoleEmploiAccessTokenGateway(
  config.poleEmploiAccessTokenConfig,
  noRateLimit,
  noRetries,
);

const referencielAgencesPE = new HttpPeAgenciesReferential(
  config.peApiUrl,
  accessTokenGateway,
  config.poleEmploiClientId,
);

describe("HttpReferencielAgencesPe", () => {
  it("Should return PE agencies", async () => {
    const a = await referencielAgencesPE.getPeAgencies();
    expect(a.length).toBeGreaterThan(10);
  });
});
