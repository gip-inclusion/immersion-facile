import { AppConfig } from "../../adapters/primary/appConfig";
import { PoleEmploiAccessTokenGateway } from "../../adapters/secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { PoleEmploiRomeGateway } from "../../adapters/secondary/immersionOffer/PoleEmploiRomeGateway";
import { noRateLimit } from "../../domain/core/ports/RateLimiter";
import { noRetries } from "../../domain/core/ports/RetryStrategy";

describe("PoleEmploiRomeGateway", () => {
  let poleEmploiRomeGateway: PoleEmploiRomeGateway;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    const accessTokenGateway = new PoleEmploiAccessTokenGateway(
      config.poleEmploiAccessTokenConfig,
      noRateLimit,
      noRetries,
    );
    poleEmploiRomeGateway = new PoleEmploiRomeGateway(
      accessTokenGateway,
      config.poleEmploiClientId,
    );
  });

  test("returns open establishments", async () => {
    const response = await poleEmploiRomeGateway.appellationToCodeMetier(
      "11158",
    );
    expect(response).toBe("B1101");
  });
});
