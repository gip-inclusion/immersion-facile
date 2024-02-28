import { GetAccessTokenResponse } from "../../../../domains/convention/ports/PoleEmploiGateway";
import { noRetries } from "../../../../domains/core/ports/RetryStrategy";
import { RealTimeGateway } from "../../../../domains/core/time-gateway/adapters/RealTimeGateway";
import { AppConfig } from "../../../primary/config/appConfig";
import { createPeAxiosSharedClient } from "../../../primary/helpers/createAxiosSharedClients";
import { InMemoryCachingGateway } from "../../core/InMemoryCachingGateway";
import { HttpPoleEmploiGateway } from "../../poleEmploi/HttpPoleEmploiGateway";
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
