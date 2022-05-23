import { AppConfig } from "../../adapters/primary/config/appConfig";
import { HttpPeAgenciesReferential } from "../../adapters/secondary/immersionOffer/HttpPeAgenciesReferential";
import { PoleEmploiAccessTokenGateway } from "../../adapters/secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { noRateLimit } from "../../domain/core/ports/RateLimiter";
import { noRetries } from "../../domain/core/ports/RetryStrategy";

const config = AppConfig.createFromEnv();
const accessTokenGateway = new PoleEmploiAccessTokenGateway(
  config.poleEmploiAccessTokenConfig,
  noRateLimit,
  noRetries,
);

const referencielAgencesPE = new HttpPeAgenciesReferential(
  accessTokenGateway,
  config.poleEmploiClientId,
);

describe("HttpReferencielAgencesPe", () => {
  it("Should return all `companies` susceptible to offer immerison of given rome located within the geographical area", async () => {
    const a = await referencielAgencesPE.getPeAgencies();
    expect(a).toBe("yolo");
  });
});
