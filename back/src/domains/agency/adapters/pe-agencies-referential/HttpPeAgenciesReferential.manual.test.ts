import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import { createPeAxiosSharedClient } from "../../../../adapters/primary/helpers/createAxiosSharedClients";
import { InMemoryCachingGateway } from "../../../../adapters/secondary/core/InMemoryCachingGateway";
import { HttpPoleEmploiGateway } from "../../../convention/adapters/pole-emploi-gateway/HttpPoleEmploiGateway";
import { GetAccessTokenResponse } from "../../../convention/ports/PoleEmploiGateway";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../../../core/time-gateway/adapters/RealTimeGateway";
import { HttpPeAgenciesReferential } from "./HttpPeAgenciesReferential";

const config = AppConfig.createFromEnv();
const axiosHttpClient = createPeAxiosSharedClient(config);

const referencielAgencesPE = new HttpPeAgenciesReferential(
  config.peApiUrl,
  new HttpPoleEmploiGateway(
    axiosHttpClient,
    new InMemoryCachingGateway<GetAccessTokenResponse>(
      new RealTimeGateway(),
      "expires_in",
    ),
    config.peApiUrl,
    config.poleEmploiAccessTokenConfig,
    noRetries,
  ),
  config.poleEmploiClientId,
);

describe("HttpReferencielAgencesPe", () => {
  it("Should return PE agencies", async () => {
    const a = await referencielAgencesPE.getPeAgencies();
    expect(a.length).toBeGreaterThan(10);
  });
});
