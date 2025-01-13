import {
  AccessTokenResponse,
  AppConfig,
} from "../../../../config/bootstrap/appConfig";
import { createPeAxiosSharedClient } from "../../../../config/helpers/createAxiosSharedClients";
import { HttpFranceTravailGateway } from "../../../convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
import { InMemoryCachingGateway } from "../../../core/caching-gateway/adapters/InMemoryCachingGateway";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../../../core/time-gateway/adapters/RealTimeGateway";
import { HttpPeAgenciesReferential } from "./HttpPeAgenciesReferential";

const config = AppConfig.createFromEnv();
const axiosHttpClient = createPeAxiosSharedClient(config);

const referencielAgencesPE = new HttpPeAgenciesReferential(
  config.peApiUrl,
  new HttpFranceTravailGateway(
    axiosHttpClient,
    new InMemoryCachingGateway<AccessTokenResponse>(
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
